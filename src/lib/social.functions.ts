import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const networkEnum = z.enum(["instagram", "tiktok", "youtube", "facebook"]);

/** Tells the UI which networks can be collected automatically. */
export const getSocialIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { SUPPORTED_NETWORKS, hasYouTubeKey } = await import("./social.server");
  return {
    enabled: true,
    youtubeEnabled: hasYouTubeKey(),
    networks: SUPPORTED_NETWORKS,
  };
});

async function getMyProfileId(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Perfil não encontrado");
  return data.id as string;
}

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
      .select("social_account_id, captured_at, followers, posts_count, avg_likes, avg_views")
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

/**
 * Saves the @ / channel the creator informed for one network and immediately
 * tries to collect the public numbers.
 */
export const saveNetworkHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ network: networkEnum, handle: z.string().max(200) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { normalizeHandle, syncSocialAccount } = await import("./social.server");
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const handle = normalizeHandle(data.network, data.handle);

    if (!handle) {
      await context.supabase
        .from("social_accounts")
        .delete()
        .eq("profile_id", profileId)
        .eq("network", data.network);
      return { ok: true, removed: true, error: null as string | null };
    }

    const { data: saved, error } = await context.supabase
      .from("social_accounts")
      .upsert(
        {
          profile_id: profileId,
          network: data.network,
          provider: data.network === "youtube" ? "youtube_api" : "public",
          handle,
          sync_status: "pending",
          sync_error: null,
        },
        { onConflict: "profile_id,network" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    try {
      const result = await syncSocialAccount(saved.id);
      return { ok: true, removed: false, followers: result.followers, error: null as string | null };
    } catch (syncError) {
      return {
        ok: true,
        removed: false,
        followers: null,
        error: syncError instanceof Error ? syncError.message : "Falha na coleta pública",
      };
    }
  });

export const syncMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const { data: owned } = await context.supabase
      .from("social_accounts")
      .select("id")
      .eq("id", data.accountRowId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!owned) throw new Error("Rede não encontrada");

    const { syncSocialAccount } = await import("./social.server");
    return syncSocialAccount(data.accountRowId);
  });

export const syncMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const { syncProfileAccounts } = await import("./social.server");
    return syncProfileAccounts(profileId);
  });

export const removeMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("id", data.accountRowId)
      .eq("profile_id", profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Curation panel: ACES can force a refresh of a profile's public numbers. */
export const adminSyncProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito");

    const { syncProfileAccounts } = await import("./social.server");
    return syncProfileAccounts(data.profileId);
  });

/** Curation panel: ACES can correct the @ informed by the creator. */
export const adminSetHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        network: networkEnum,
        handle: z.string().max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito");

    const { normalizeHandle, syncSocialAccount } = await import("./social.server");
    const handle = normalizeHandle(data.network, data.handle);

    if (!handle) {
      await context.supabase
        .from("social_accounts")
        .delete()
        .eq("profile_id", data.profileId)
        .eq("network", data.network);
      return { ok: true, removed: true, error: null as string | null };
    }

    const { data: saved, error } = await context.supabase
      .from("social_accounts")
      .upsert(
        {
          profile_id: data.profileId,
          network: data.network,
          provider: data.network === "youtube" ? "youtube_api" : "public",
          handle,
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
      return { ok: true, removed: false, error: null as string | null };
    } catch (syncError) {
      return {
        ok: true,
        removed: false,
        error: syncError instanceof Error ? syncError.message : "Falha na coleta pública",
      };
    }
  });
