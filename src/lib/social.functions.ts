import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const networkEnum = z.enum(["instagram", "tiktok", "youtube", "facebook", "linkedin"]);

/** Tells the UI whether the aggregator credentials are configured. */
export const getSocialIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getProviderConfig, SUPPORTED_NETWORKS } = await import("./social.server");
  const config = getProviderConfig();
  return {
    enabled: Boolean(config),
    environment: config?.sdkEnvironment ?? null,
    networks: SUPPORTED_NETWORKS,
  };
});

export const listMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return [];

    const { data, error } = await context.supabase
      .from("social_accounts")
      .select("id, network, handle, profile_url, last_synced_at, sync_status, sync_error")
      .eq("profile_id", profile.id);
    if (error) throw new Error(error.message);

    const accounts = data ?? [];
    if (!accounts.length) return [];

    const { data: snapshots } = await context.supabase
      .from("social_snapshots")
      .select(
        "social_account_id, captured_at, followers, engagement_rate, avg_likes, avg_comments, avg_views",
      )
      .in(
        "social_account_id",
        accounts.map((a) => a.id),
      )
      .order("captured_at", { ascending: false });

    return accounts.map((account) => ({
      ...account,
      latest: (snapshots ?? []).find((s) => s.social_account_id === account.id) ?? null,
    }));
  });

/** Mints the short-lived token the Connect SDK needs, for the caller's profile. */
export const createConnectSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ network: networkEnum.optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const {
      getProviderConfig,
      ensureProviderUser,
      createSdkToken,
      getWorkPlatformId,
    } = await import("./social.server");

    const config = getProviderConfig();
    if (!config) throw new Error("Integração de métricas ainda não configurada");

    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("id, display_name")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Perfil não encontrado");

    const providerUserId = await ensureProviderUser(config, profile.id, profile.display_name);
    const token = await createSdkToken(config, providerUserId);
    const workPlatformId = data.network
      ? await getWorkPlatformId(config, data.network)
      : null;

    return {
      token,
      providerUserId,
      environment: config.sdkEnvironment,
      workPlatformId,
      profileId: profile.id,
    };
  });

/** Called right after the SDK reports a connected account. */
export const registerConnectedAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        accountId: z.string().min(1),
        providerUserId: z.string().min(1),
        network: networkEnum.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getProviderConfig, fetchAccount, syncSocialAccount } = await import(
      "./social.server"
    );
    const config = getProviderConfig();
    if (!config) throw new Error("Integração de métricas ainda não configurada");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("Perfil não encontrado");

    const account = await fetchAccount(config, data.accountId);
    const platformName = String(
      account["work_platform"]?.name ?? account["platform_name"] ?? "",
    ).toLowerCase();
    const network =
      data.network ??
      (["instagram", "tiktok", "youtube", "facebook", "linkedin"] as const).find((n) =>
        platformName.includes(n),
      );
    if (!network) throw new Error("Rede social não reconhecida");

    const { data: saved, error } = await context.supabase
      .from("social_accounts")
      .upsert(
        {
          profile_id: profile.id,
          network,
          provider: "insightiq",
          provider_account_id: data.accountId,
          provider_user_id: data.providerUserId,
          handle: account["platform_username"] ?? null,
          sync_status: "pending",
          sync_error: null,
        },
        { onConflict: "profile_id,network" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    try {
      await syncSocialAccount(saved.id);
    } catch (syncError) {
      console.error("[social] first sync failed", syncError);
    }

    return { ok: true, network };
  });

export const syncMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owned } = await context.supabase
      .from("social_accounts")
      .select("id")
      .eq("id", data.accountRowId)
      .maybeSingle();
    if (!owned) throw new Error("Conta não encontrada");

    const { syncSocialAccount } = await import("./social.server");
    return syncSocialAccount(data.accountRowId);
  });

export const disconnectMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: account } = await context.supabase
      .from("social_accounts")
      .select("id, network, provider_account_id, profile_id")
      .eq("id", data.accountRowId)
      .maybeSingle();
    if (!account) throw new Error("Conta não encontrada");

    const { getProviderConfig, disconnectProviderAccount } = await import("./social.server");
    const config = getProviderConfig();
    if (config && account.provider_account_id) {
      await disconnectProviderAccount(config, account.provider_account_id);
    }

    await context.supabase
      .from("profile_metrics")
      .update({ source: "manual", verified_at: null })
      .eq("profile_id", account.profile_id)
      .eq("network", account.network);

    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("id", account.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: re-sync every connected account of one profile. */
export const syncProfileAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: accounts } = await context.supabase
      .from("social_accounts")
      .select("id")
      .eq("profile_id", data.profileId);

    const { syncSocialAccount } = await import("./social.server");
    let synced = 0;
    for (const account of accounts ?? []) {
      try {
        await syncSocialAccount(account.id);
        synced += 1;
      } catch (error) {
        console.error("[social] admin sync failed", error);
      }
    }
    return { synced, total: (accounts ?? []).length };
  });

export const listConnectionsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await context.supabase
      .from("social_accounts")
      .select("id, profile_id, network, handle, last_synced_at, sync_status");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
