import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const networkEnum = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "kwai",
  "twitter",
]);

const YOUTUBE_KEY_SETTING = "youtube_api_key";

/** Tells the UI which networks can be collected automatically. */
export const getSocialIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { SUPPORTED_NETWORKS, DECLARED_NETWORKS, hasYouTubeKey } = await import("./social.server");
  return {
    enabled: true,
    youtubeEnabled: await hasYouTubeKey(),
    networks: SUPPORTED_NETWORKS,
    declaredNetworks: DECLARED_NETWORKS,
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

const ACCOUNT_COLUMNS =
  "id, network, handle, profile_url, avatar_url, display_name, is_declared, declared_followers, last_synced_at, sync_status, sync_error";

async function loadAccounts(supabase: any, profileId: string) {
  const { data, error } = await supabase
    .from("social_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("profile_id", profileId)
    .order("network", { ascending: true });
  if (error) throw new Error(error.message);

  const accounts = (data ?? []) as Array<any>;
  if (!accounts.length) return [];

  const { data: snapshots } = await supabase
    .from("social_snapshots")
    .select("social_account_id, captured_at, followers, posts_count, avg_likes, avg_views")
    .in(
      "social_account_id",
      accounts.map((a) => a.id),
    )
    .order("captured_at", { ascending: false });

  return accounts.map((account) => ({
    ...account,
    latest:
      (snapshots ?? []).find((s: any) => s.social_account_id === account.id) ?? null,
  }));
}

/** Every network account linked by the signed-in creator. */
export const listMyAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return [];
    return loadAccounts(context.supabase, profile.id);
  });

/** Wizard step 2: collects the public numbers without saving anything yet. */
export const previewNetworkHandle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ network: networkEnum, handle: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { normalizeHandle, collectPublicMetrics, DECLARED_NETWORKS } = await import(
      "./social.server"
    );
    const handle = normalizeHandle(data.network, data.handle);
    if (!handle) throw new Error("Informe um @ válido");

    if (DECLARED_NETWORKS.includes(data.network)) {
      return {
        handle,
        metrics: null as any,
        error: "Esta rede não permite coleta pública — informe o número de seguidores." as string | null,
      };
    }

    try {
      const metrics = await collectPublicMetrics(data.network, handle);
  return { handle, metrics: metrics as any, error: null as string | null };
    } catch (error) {
      return {
        handle,
        metrics: null as any,
        error: (error instanceof Error ? error.message : "Falha na coleta pública") as string | null,
      };
    }
  });

/** Wizard step 3: saves the account, with collected or declared numbers. */
export const addNetworkAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        network: networkEnum,
        handle: z.string().min(1).max(200),
        declaredFollowers: z.string().trim().max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { normalizeHandle, syncSocialAccount, DECLARED_NETWORKS } = await import(
      "./social.server"
    );
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const handle = normalizeHandle(data.network, data.handle);
    if (!handle) throw new Error("Informe um @ válido");

    const declared = (data.declaredFollowers ?? "").trim();
    const declaredOnly = DECLARED_NETWORKS.includes(data.network) || Boolean(declared);

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
          is_declared: declaredOnly,
          declared_followers: declared || null,
        },
        { onConflict: "profile_id,network,handle" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await touchProfileContent(context.supabase, profileId);

    if (declared) {
      return { ok: true, accountId: saved.id, error: null as string | null };
    }

    if (DECLARED_NETWORKS.includes(data.network)) {
      return { ok: true, accountId: saved.id, error: null as string | null };
    }

    try {
      await syncSocialAccount(saved.id);
      return { ok: true, accountId: saved.id, error: null as string | null };
    } catch (syncError) {
      return {
        ok: true,
        accountId: saved.id,
        error: syncError instanceof Error ? syncError.message : "Falha na coleta pública",
      };
    }
  });

/** Marks profile content as changed so the dashboard shows "pending publish". */
async function touchProfileContent(supabase: any, profileId: string) {
  await supabase
    .from("profiles")
    .update({ content_changed_at: new Date().toISOString() })
    .eq("id", profileId);
}

function toNumber(value?: string | null) {
  if (value === undefined || value === null) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Card action: creator types followers/posts/likes/views manually for one account. */
export const setDeclaredFollowers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        accountRowId: z.string().uuid(),
        followers: z.string().trim().max(20),
        posts: z.string().trim().max(20).optional(),
        likes: z.string().trim().max(20).optional(),
        views: z.string().trim().max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const { data: account } = await context.supabase
      .from("social_accounts")
      .select("id, network, handle")
      .eq("id", data.accountRowId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!account) throw new Error("Rede não encontrada");

    await context.supabase
      .from("social_accounts")
      .update({
        is_declared: Boolean(data.followers),
        declared_followers: data.followers || null,
      })
      .eq("id", account.id);

    const followers = toNumber(data.followers);
    const posts = toNumber(data.posts);
    const likes = toNumber(data.likes);
    const views = toNumber(data.views);

    if (followers !== null || posts !== null || likes !== null || views !== null) {
      await context.supabase.from("social_snapshots").insert({
        social_account_id: account.id,
        followers,
        posts_count: posts,
        avg_likes: likes,
        avg_views: views,
      });
    }

    await touchProfileContent(context.supabase, profileId);

    return { ok: true, removed: !data.followers };
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
    const result = await syncSocialAccount(data.accountRowId);
    await touchProfileContent(context.supabase, profileId);
    return result;
  });

export const removeMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const profileId = await getMyProfileId(context.supabase, context.userId);
    const { data: account } = await context.supabase
      .from("social_accounts")
      .select("id, network, handle")
      .eq("id", data.accountRowId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!account) throw new Error("Rede não encontrada");

    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("id", account.id)
      .eq("profile_id", profileId);
    if (error) throw new Error(error.message);
    await touchProfileContent(context.supabase, profileId);
    return { ok: true };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Acesso restrito");
}

/** Curation panel: ACES can force a refresh of a profile's public numbers. */
export const adminSyncProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { syncProfileAccounts } = await import("./social.server");
    return syncProfileAccounts(data.profileId);
  });

/** Curation panel: ACES can link an extra @ to a profile. */
export const adminAddAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        network: networkEnum,
        handle: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { normalizeHandle, syncSocialAccount, DECLARED_NETWORKS } = await import(
      "./social.server"
    );
    const handle = normalizeHandle(data.network, data.handle);
    if (!handle) throw new Error("Informe um @ válido");

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
          is_declared: DECLARED_NETWORKS.includes(data.network),
        },
        { onConflict: "profile_id,network,handle" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (DECLARED_NETWORKS.includes(data.network)) {
      return { ok: true, error: null as string | null };
    }

    try {
      await syncSocialAccount(saved.id);
      return { ok: true, error: null as string | null };
    } catch (syncError) {
      return {
        ok: true,
        error: syncError instanceof Error ? syncError.message : "Falha na coleta pública",
      };
    }
  });

/** Curation panel: ACES can unlink one account. */
export const adminRemoveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ accountRowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("social_accounts")
      .delete()
      .eq("id", data.accountRowId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Curation panel: accounts linked to one profile. */
export const adminListAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return loadAccounts(context.supabase, data.profileId);
  });

/** Curation panel: reads whether the YouTube/Google API key is configured. */
export const adminGetYouTubeKeyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data } = await context.supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", YOUTUBE_KEY_SETTING)
      .maybeSingle();

    const saved = data?.value?.trim() ?? "";
    const fromEnv = Boolean(process.env["YOUTUBE_API_KEY"] ?? process.env["GOOGLE_API_KEY"]);
    return {
      configured: Boolean(saved) || fromEnv,
      source: saved ? ("panel" as const) : fromEnv ? ("secret" as const) : ("none" as const),
      masked: saved ? `${saved.slice(0, 6)}••••${saved.slice(-4)}` : null,
      updatedAt: data?.updated_at ?? null,
    };
  });

/** Curation panel: saves or clears the YouTube/Google API key. */
export const adminSetYouTubeKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ key: z.string().trim().max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    if (!data.key) {
      const { error } = await context.supabase
        .from("app_settings")
        .delete()
        .eq("key", YOUTUBE_KEY_SETTING);
      if (error) throw new Error(error.message);
      return { ok: true, removed: true };
    }

    const { error } = await context.supabase.from("app_settings").upsert(
      { key: YOUTUBE_KEY_SETTING, value: data.key, updated_by: context.userId },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, removed: false };
  });
