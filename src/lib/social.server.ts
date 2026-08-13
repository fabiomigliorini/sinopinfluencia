import type { Database } from "@/integrations/supabase/types";

type Network = Database["public"]["Enums"]["social_network"];

export type ProviderConfig = {
  clientId: string;
  secret: string;
  apiBase: string;
  sdkEnvironment: "sandbox" | "staging" | "production";
};

/** Networks the aggregator can import. Kwai/X stay manual. */
export const SUPPORTED_NETWORKS: Network[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
];

/** Platform names as reported by the provider's work-platforms endpoint. */
const PLATFORM_NAME_BY_NETWORK: Record<string, string[]> = {
  instagram: ["instagram"],
  tiktok: ["tiktok", "tik tok"],
  youtube: ["youtube"],
  facebook: ["facebook"],
  linkedin: ["linkedin"],
};

export function getProviderConfig(): ProviderConfig | null {
  const clientId = process.env["INSIGHTIQ_CLIENT_ID"];
  const secret = process.env["INSIGHTIQ_SECRET"];
  if (!clientId || !secret) return null;
  const env = (process.env["INSIGHTIQ_ENV"] ?? "production").toLowerCase();
  const sdkEnvironment =
    env === "sandbox" || env === "staging" ? (env as "sandbox" | "staging") : "production";
  const apiBase =
    process.env["INSIGHTIQ_API_BASE"] ??
    (sdkEnvironment === "production"
      ? "https://api.insightiq.ai"
      : `https://api.${sdkEnvironment}.insightiq.ai`);
  return { clientId, secret, apiBase, sdkEnvironment };
}

function authHeader(config: ProviderConfig) {
  const raw = `${config.clientId}:${config.secret}`;
  const encoded =
    typeof btoa === "function" ? btoa(raw) : Buffer.from(raw).toString("base64");
  return `Basic ${encoded}`;
}

async function providerFetch<T>(
  config: ProviderConfig,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${config.apiBase}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: authHeader(config),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`[social] provider ${path} failed [${response.status}]: ${text}`);
    throw new Error(`Provider request failed [${response.status}]: ${text}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/** Creates (or reuses) the provider-side user representing this profile. */
export async function ensureProviderUser(
  config: ProviderConfig,
  profileId: string,
  displayName: string,
) {
  const externalId = `sinop-influencia-${profileId}`;
  try {
    const created = await providerFetch<{ id: string }>(config, "/v1/users", {
      method: "POST",
      body: { name: displayName, external_id: externalId },
    });
    return created.id;
  } catch {
    const existing = await providerFetch<{ id: string }>(
      config,
      `/v1/users/external_id/${encodeURIComponent(externalId)}`,
    );
    return existing.id;
  }
}

export async function createSdkToken(config: ProviderConfig, providerUserId: string) {
  const result = await providerFetch<{ sdk_token: string; expires_at?: string }>(
    config,
    "/v1/sdk-tokens",
    {
      method: "POST",
      body: {
        user_id: providerUserId,
        products: ["IDENTITY", "IDENTITY.AUDIENCE", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"],
      },
    },
  );
  return result.sdk_token;
}

export async function getWorkPlatformId(config: ProviderConfig, network: Network) {
  const names = PLATFORM_NAME_BY_NETWORK[network];
  if (!names) return null;
  const result = await providerFetch<{ data?: Array<{ id: string; name: string }> }>(
    config,
    "/v1/work-platforms?limit=100",
  );
  const match = (result.data ?? []).find((platform) =>
    names.includes((platform.name ?? "").toLowerCase()),
  );
  return match?.id ?? null;
}

export type NormalizedMetrics = {
  handle: string | null;
  profileUrl: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  engagementRate: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  reach: number | null;
  raw: unknown;
};

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/** Provider payload shapes differ per platform; read every known field name. */
export function normalizeProfilePayload(payload: Record<string, any>): NormalizedMetrics {
  const reputation = payload["reputation"] ?? {};
  const engagement = payload["engagement"] ?? {};
  return {
    handle: payload["platform_username"] ?? payload["username"] ?? null,
    profileUrl: payload["url"] ?? payload["profile_url"] ?? null,
    followers:
      num(reputation["follower_count"]) ??
      num(reputation["subscriber_count"]) ??
      num(payload["follower_count"]),
    following: num(reputation["following_count"]) ?? num(payload["following_count"]),
    postsCount: num(reputation["content_count"]) ?? num(payload["content_count"]),
    engagementRate:
      num(engagement["engagement_rate"]) ??
      num(payload["engagement_rate"]) ??
      num(reputation["engagement_rate"]),
    avgLikes: num(engagement["average_likes"]) ?? num(payload["average_likes"]),
    avgComments: num(engagement["average_comments"]) ?? num(payload["average_comments"]),
    avgViews: num(engagement["average_views"]) ?? num(payload["average_views"]),
    reach: num(engagement["average_reach"]) ?? num(payload["average_reach"]),
    raw: payload,
  };
}

export async function fetchAccountProfile(config: ProviderConfig, accountId: string) {
  const result = await providerFetch<{ data?: Array<Record<string, any>> }>(
    config,
    `/v1/profiles?account_id=${encodeURIComponent(accountId)}`,
  );
  const first = (result.data ?? [])[0];
  if (!first) return null;
  return normalizeProfilePayload(first);
}

export async function fetchAccount(config: ProviderConfig, accountId: string) {
  return providerFetch<Record<string, any>>(
    config,
    `/v1/accounts/${encodeURIComponent(accountId)}`,
  );
}

export async function disconnectProviderAccount(config: ProviderConfig, accountId: string) {
  try {
    await providerFetch(config, `/v1/accounts/${encodeURIComponent(accountId)}/disconnect`, {
      method: "POST",
    });
  } catch (error) {
    console.error("[social] disconnect failed", error);
  }
}

function formatFollowers(followers: number | null) {
  if (followers === null) return null;
  if (followers >= 1_000_000) return `${(followers / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (followers >= 1_000) return `${(followers / 1_000).toFixed(1).replace(".", ",")}K`;
  return String(followers);
}

/**
 * Pulls fresh metrics for one connected account and stores a snapshot plus the
 * derived public metric row. Uses the admin client because it also runs from
 * the cron route and webhooks where there is no user session.
 */
export async function syncSocialAccount(accountRowId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const config = getProviderConfig();
  if (!config) throw new Error("Integração de métricas não configurada");

  const { data: account, error } = await supabaseAdmin
    .from("social_accounts")
    .select("id, profile_id, network, provider_account_id")
    .eq("id", accountRowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account?.provider_account_id) throw new Error("Conta sem identificador do provedor");

  try {
    const metrics = await fetchAccountProfile(config, account.provider_account_id);
    if (!metrics) {
      await supabaseAdmin
        .from("social_accounts")
        .update({
          sync_status: "pending",
          sync_error: "Provedor ainda está coletando os dados desta conta",
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", account.id);
      return { ok: false, pending: true };
    }

    await supabaseAdmin.from("social_snapshots").insert({
      social_account_id: account.id,
      followers: metrics.followers,
      following: metrics.following,
      posts_count: metrics.postsCount,
      engagement_rate: metrics.engagementRate,
      avg_likes: metrics.avgLikes,
      avg_comments: metrics.avgComments,
      avg_views: metrics.avgViews,
      reach: metrics.reach,
      raw: metrics.raw as never,
    });

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("social_accounts")
      .update({
        sync_status: "ok",
        sync_error: null,
        last_synced_at: now,
        handle: metrics.handle,
        profile_url: metrics.profileUrl,
      })
      .eq("id", account.id);

    const followersLabel = formatFollowers(metrics.followers);
    const { data: existingMetric } = await supabaseAdmin
      .from("profile_metrics")
      .select("id")
      .eq("profile_id", account.profile_id)
      .eq("network", account.network)
      .maybeSingle();

    if (existingMetric) {
      await supabaseAdmin
        .from("profile_metrics")
        .update({ followers: followersLabel, source: "api", verified_at: now })
        .eq("id", existingMetric.id);
    } else {
      await supabaseAdmin.from("profile_metrics").insert({
        profile_id: account.profile_id,
        network: account.network,
        followers: followersLabel,
        source: "api",
        verified_at: now,
      });
    }

    return { ok: true, followers: metrics.followers };
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : "Erro desconhecido";
    await supabaseAdmin
      .from("social_accounts")
      .update({
        sync_status: "error",
        sync_error: message.slice(0, 500),
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", account.id);
    throw syncError;
  }
}
