import type { Database } from "@/integrations/supabase/types";

type Network = Database["public"]["Enums"]["social_network"];

/** Networks we can collect from public sources. Kwai/X/LinkedIn stay declared. */
export const SUPPORTED_NETWORKS: Network[] = ["instagram", "tiktok", "youtube", "facebook"];

/** Networks with no reliable public source — the creator declares the number. */
export const DECLARED_NETWORKS: Network[] = ["linkedin", "kwai", "twitter"];

export const NETWORK_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  kwai: "Kwai",
  twitter: "X (Twitter)",
};

export type PublicMetrics = {
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  likes: number | null;
  views: number | null;
  raw: unknown;
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Meta serves the public link preview (with counters) to crawler user agents. */
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/**
 * Scraped names sometimes carry leftover JSON from the surrounding payload
 * (e.g. `MG Papelaria","verified":false`). Cut at the first quote/brace.
 */
export function cleanDisplayName(value?: string | null): string | null {
  if (!value) return null;
  const cut = value.split(/["'{}\\]|,\s*"/)[0]?.replace(/\s+/g, " ").trim() ?? "";
  return cut.length >= 2 ? cut.slice(0, 80) : null;
}

async function getText(
  url: string,
  headers: Record<string, string> = {},
  options: { exactHeaders?: boolean } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Facebook falls back to the login shell (no og: tags) when extra headers
      // are present, so some callers need the user agent to be the only header.
      headers: options.exactHeaders
        ? headers
        : {
            "User-Agent": BROWSER_UA,
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
            ...headers,
          },
    });

    const body = await response.text();
    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        throw new Error(
          "A rede social bloqueou a coleta automática agora (limite de acessos). Tente novamente mais tarde ou informe o número manualmente.",
        );
      }
      throw new Error(`Resposta ${response.status} da rede social`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

/** Strips @, full URLs and trailing slashes from whatever the creator typed. */
export function normalizeHandle(network: Network, raw: string): string {
  let value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.includes("/")) {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withProtocol);
      const parts = url.pathname.split("/").filter(Boolean);
      if (network === "youtube") {
        const channelIndex = parts.indexOf("channel");
        if (channelIndex >= 0 && parts[channelIndex + 1]) {
          return parts[channelIndex + 1]!;
        }
        const named = parts.find((p) => p.startsWith("@")) ?? parts[parts.length - 1];
        value = named ?? "";
      } else {
        value = parts[0] ?? "";
      }
    } catch {
      /* fall through and use the raw text */
    }
  }
  return value.replace(/^@+/, "").replace(/\/+$/, "").trim();
}

function firstNumber(pattern: RegExp, html: string): number | null {
  const match = html.match(pattern);
  if (!match) return null;
  const value = Number(String(match[1]).replace(/[.,\s]/g, ""));
  return Number.isFinite(value) ? value : null;
}

/** Reads the counter that precedes a label, e.g. "686M Followers" or "28 686 009 gillar". */
function numberBefore(text: string, label: RegExp): number | null {
  // Collapse thousand separators first so each counter is a single token.
  const flat = text.replace(/(\d)[.,\s\u00a0](?=\d{3}(?!\d))/g, "$1");
  const pattern = new RegExp(
    `(\\d+(?:[.,]\\d+)?\\s*(?:K|M|B|mil|mi)?)\\s*${label.source}`,
    "i",
  );
  const match = flat.match(pattern);
  return match ? compactToNumber(match[1]!) : null;
}

/** Turns HTML entities into plain text so counters become readable. */
function decodeEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/** Converts "12.4K" / "1,2M" / "8,555" / "28 686 009" counters into a number. */
function compactToNumber(text: string): number | null {
  const match = text.match(/([\d][\d.,\s\u00a0]*)\s*([KkMmBb]|mil|mi)?/);
  if (!match) return null;
  const digits = match[1]!.trim();
  const suffix = (match[2] ?? "").toLowerCase();

  if (!suffix) {
    const plain = Number(digits.replace(/[.,\s\u00a0]/g, ""));
    return Number.isFinite(plain) ? plain : null;
  }
  const base = Number(digits.replace(/[\s\u00a0]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  if (!Number.isFinite(base)) return null;
  if (suffix === "k" || suffix === "mil") return Math.round(base * 1_000);
  if (suffix === "m" || suffix === "mi") return Math.round(base * 1_000_000);
  return Math.round(base * 1_000_000_000);
}

/** Last-resort source: search engines index Instagram's own meta description. */
async function fetchInstagramFromSearch(handle: string): Promise<PublicMetrics | null> {
  const query = `instagram.com/${handle} followers`;
  let html: string;
  try {
    html = await getText(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    );
  } catch {
    return null;
  }

  const target = handle.toLowerCase();
  const blocks = html.split(/class="result__snippet"/).slice(1);
  for (const block of blocks) {
    const chunk = decodeEntities(
      block.slice(0, 1200).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
    );
    // The snippet link is rewritten by DuckDuckGo — decode it to check the handle.
    const linked = decodeURIComponent(block.match(/uddg=([^&"]+)/)?.[1] ?? "");
    const linkedHandle = linked
      .match(/instagram\.com\/([^/?#]+)\/?$/i)?.[1]
      ?.toLowerCase();
    if (linkedHandle !== target) continue;

    const followers = numberBefore(chunk, /followers/i) ?? numberBefore(chunk, /seguidores/i);
    if (followers === null) continue;
    return {
      handle,
      displayName: chunk.match(/-\s*([^(]{2,60})\s*\(@/)?.[1]?.trim() || null,
      avatarUrl: null,
      profileUrl: `https://www.instagram.com/${handle}/`,
      followers,
      following: numberBefore(chunk, /following/i) ?? numberBefore(chunk, /seguindo/i),
      postsCount: numberBefore(chunk, /posts/i) ?? numberBefore(chunk, /publica[çc][õo]es/i),
      likes: null,
      views: null,
      raw: { source: "instagram_search_snippet", snippet: chunk.slice(0, 300) },
    };
  }
  return null;
}

export async function fetchInstagramPublic(handle: string): Promise<PublicMetrics> {
  const profileUrl = `https://www.instagram.com/${handle}/`;
  // Public web profile endpoint first — it returns clean JSON when available.
  const apiHosts = ["https://i.instagram.com", "https://www.instagram.com"];
  for (const host of apiHosts) {
    try {
      const json = await getText(
        `${host}/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
        { "x-ig-app-id": "936619743392459", "x-requested-with": "XMLHttpRequest" },
      );
      const parsed = JSON.parse(json) as {
        data?: { user?: Record<string, any> };
      };
      const user = parsed.data?.user;
      if (user) {
        return {
          handle,
          displayName: user["full_name"] ?? null,
          avatarUrl: user["profile_pic_url_hd"] ?? user["profile_pic_url"] ?? null,
          profileUrl,
          followers: user["edge_followed_by"]?.count ?? null,
          following: user["edge_follow"]?.count ?? null,
          postsCount: user["edge_owner_to_timeline_media"]?.count ?? null,
          likes: null,
          views: null,
          raw: {
            source: "instagram_web_profile_info",
            is_private: user["is_private"] ?? null,
            full_name: user["full_name"] ?? null,
            biography: user["biography"] ?? null,
          },
        };
      }
    } catch {
      /* try the next source */
    }
  }

  // The regular profile endpoints are frequently rate-limited, while Instagram's
  // public embed payload still exposes the profile header counters without login.
  try {
    const embedHtml = await getText(`${profileUrl}embed/`, {
      "User-Agent": CRAWLER_UA,
    });
    const followers =
      firstNumber(/\\?"followers_count\\?"\s*:\s*(\d+)/, embedHtml) ??
      firstNumber(/\\?"edge_followed_by\\?"\s*:\s*\{\\?"count\\?"\s*:\s*(\d+)/, embedHtml);
    if (followers !== null) {
      const posts =
        firstNumber(/\\?"posts_count\\?"\s*:\s*(\d+)/, embedHtml) ??
        firstNumber(/\\?"edge_owner_to_timeline_media\\?"\s*:\s*\{\\?"count\\?"\s*:\s*(\d+)/, embedHtml);
      // The embed payload double-escapes its JSON strings, so unescape before
      // pulling the profile header name/avatar out of it.
      const unescaped = embedHtml.replace(/\\{1,2}"/g, '"').replace(/\\u0026/g, "&");
      const embedName =
        cleanDisplayName(unescaped.match(/"full_name"\s*:\s*"([^"]*)"/)?.[1]) ??
        cleanDisplayName(
          decodeEntities(
            embedHtml.match(/property="og:title" content="([^"]+)"/)?.[1] ?? "",
          ).replace(/\s*[•|]\s*Instagram.*$/i, ""),
        );
      const embedAvatar =
        unescaped
          .match(/"profile_pic_url(?:_hd)?"\s*:\s*"([^"]+)"/)?.[1]
          ?.replace(/\\u002F/gi, "/")
          .replace(/\\+/g, "") ?? null;
      return {
        handle,
        displayName: embedName,
        avatarUrl: embedAvatar,
        profileUrl,
        followers,
        following: null,
        postsCount: posts,
        likes: null,
        views: null,
        raw: { source: "instagram_embed" },
      };

    }
  } catch {
    /* continue with crawler preview and search snippet fallbacks */
  }

  // Public link preview: Meta serves counters in og:description to crawlers.
  let html = "";
  try {
    html = await getText(profileUrl, { "User-Agent": CRAWLER_UA });
  } catch {
    html = "";
  }
  const description = decodeEntities(
    html.match(/property="og:description" content="([^"]+)"/)?.[1] ??
      html.match(/name="description" content="([^"]+)"/)?.[1] ??
      "",
  );
  const followers =
    firstNumber(/"edge_followed_by":\{"count":(\d+)\}/, html) ??
    firstNumber(/"follower_count":(\d+)/, html) ??
    numberBefore(description, /(?:followers|seguidores)/i);
  const posts =
    firstNumber(/"edge_owner_to_timeline_media":\{"count":(\d+)/, html) ??
    firstNumber(/"media_count":(\d+)/, html) ??
    numberBefore(description, /(?:posts|publica[çc][õo]es)/i);
  const following = numberBefore(description, /(?:following|seguindo)/i);

  if (followers === null) {
    const fromSearch = await fetchInstagramFromSearch(handle);
    if (fromSearch) return fromSearch;
    throw new Error(
      "O Instagram está bloqueando a coleta automática agora. Tente novamente em alguns minutos ou informe os números manualmente.",
    );
  }
  return {
    handle,
    displayName: decodeEntities(
      html.match(/property="og:title" content="([^"]+)"/)?.[1] ?? "",
    ) || null,
    avatarUrl: html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? null,
    profileUrl,
    followers,
    following,
    postsCount: posts,
    likes: null,
    views: null,
    raw: { source: "instagram_preview", description },
  };
}


export async function fetchTikTokPublic(handle: string): Promise<PublicMetrics> {
  const profileUrl = `https://www.tiktok.com/@${handle}`;
  const html = await getText(profileUrl);
  const followers = firstNumber(/"followerCount":(\d+)/, html);
  const following = firstNumber(/"followingCount":(\d+)/, html);
  const hearts = firstNumber(/"heart(?:Count)?":(\d+)/, html);
  const videos = firstNumber(/"videoCount":(\d+)/, html);
  if (followers === null) {
    throw new Error("Não foi possível ler os seguidores públicos do TikTok");
  }
  return {
    handle,
    displayName: html.match(/"nickname":"([^"]+)"/)?.[1] ?? null,
    avatarUrl:
      html.match(/"avatarLarger":"([^"]+)"/)?.[1]?.replace(/\\u002F/g, "/") ??
      html.match(/property="og:image" content="([^"]+)"/)?.[1] ??
      null,
    profileUrl,
    followers,
    following,
    postsCount: videos,
    likes: hearts,
    views: null,
    raw: { source: "tiktok_html" },
  };
}

/** Search engines index the Facebook page preview, which carries the counters. */
async function fetchFacebookFromSearch(handle: string): Promise<PublicMetrics | null> {
  let html: string;
  try {
    html = await getText(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
        `facebook.com/${handle} seguidores`,
      )}`,
    );
  } catch {
    return null;
  }
  const target = handle.toLowerCase();
  const blocks = html.split(/class="result__snippet"/).slice(1);
  for (const block of blocks) {
    const linked = decodeURIComponent(block.match(/uddg=([^&"]+)/)?.[1] ?? "");
    if (!/facebook\.com/i.test(linked)) continue;
    if (!linked.toLowerCase().includes(target)) continue;
    const chunk = decodeEntities(
      block.slice(0, 1200).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
    );
    const followers =
      numberBefore(chunk, /(?:followers|seguidores)/i) ??
      numberBefore(chunk, /(?:pessoas curtiram|curtidas|likes)/i);
    if (followers === null) continue;
    return {
      handle,
      displayName: null,
      avatarUrl: null,
      profileUrl: `https://www.facebook.com/${handle}`,
      followers,
      following: null,
      postsCount: null,
      likes: null,
      views: null,
      raw: { source: "facebook_search_snippet", snippet: chunk.slice(0, 300) },
    };
  }
  return null;
}

export async function fetchFacebookPublic(handle: string): Promise<PublicMetrics> {
  const profileUrl = `https://www.facebook.com/${handle}`;
  const avatarUrl = `https://graph.facebook.com/${encodeURIComponent(handle)}/picture?type=large`;
  // Meta only serves the counters in the link preview it gives to crawlers, and
  // only for Pages. Try a few hosts because some of them rate-limit separately.
  const candidates = [
    profileUrl,
    `https://www.facebook.com/${handle}/?locale=pt_BR`,
    `https://m.facebook.com/${handle}`,
    `https://web.facebook.com/${handle}`,
  ];
  let lastError: unknown = null;
  for (const url of candidates) {
    let html = "";
    try {
      // The crawler UA must be the ONLY header, otherwise Meta serves the
      // login shell without any og: metadata.
      html = await getText(url, { "User-Agent": CRAWLER_UA }, { exactHeaders: true });
    } catch (error) {
      lastError = error;
      continue;
    }
    const description = decodeEntities(
      html.match(/property="og:description" content="([^"]+)"/)?.[1] ??
        html.match(/name="description" content="([^"]+)"/)?.[1] ??
        "",
    );
    // Meta answers in whatever locale it picks, so accept the usual labels and
    // fall back to the first counter in the preview text ("Name, City. N likes").
    const followers =
      firstNumber(/"follower_count":(\d+)/, html) ??
      numberBefore(description, /(?:followers|seguidores|volgers)/i) ??
      numberBefore(
        description,
        /(?:pessoas curtiram|curtidas|likes|vind-ik-leuks|gillar|me gusta|j.aime)/i,
      ) ??
      numberBefore(description, /\S/);
    if (followers === null) continue;

    return {
      handle,
      displayName:
        decodeEntities(html.match(/property="og:title" content="([^"]+)"/)?.[1] ?? "") ||
        null,
      // Facebook's og:image points to a crawler-only lookaside URL. It returns
      // HTML to normal browsers, so use the public profile-picture endpoint.
      avatarUrl,
      profileUrl,
      followers,
      following: null,
      postsCount: null,
      likes: null,
      views: null,
      raw: { source: "facebook_preview", description },
    };
  }

  const fromSearch = await fetchFacebookFromSearch(handle);
  if (fromSearch) return fromSearch;

  if (lastError instanceof Error && /limite de acessos/i.test(lastError.message)) {
    throw lastError;
  }
  throw new Error(
    "O Facebook só divulga seguidores de Páginas. Se este @ é um perfil pessoal, informe o número manualmente (ou cadastre a Página do criador).",
  );
}


export const YOUTUBE_KEY_SETTING = "youtube_api_key";

/** Key saved by the ACES team in the admin panel, or the project secret. */
export async function getYouTubeKey(): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", YOUTUBE_KEY_SETTING)
      .maybeSingle();
    const saved = data?.value?.trim();
    if (saved) return saved;
  } catch {
    /* fall back to env */
  }
  return process.env["YOUTUBE_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? null;
}

export async function hasYouTubeKey() {
  return Boolean(await getYouTubeKey());
}

export async function fetchYouTubePublic(handle: string): Promise<PublicMetrics> {
  const key = await getYouTubeKey();
  if (!key) throw new Error("Chave da API do YouTube não configurada");


  const isChannelId = /^UC[\w-]{20,}$/.test(handle);
  const base = "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics";
  const url = isChannelId
    ? `${base}&id=${encodeURIComponent(handle)}&key=${key}`
    : `${base}&forHandle=${encodeURIComponent(handle)}&key=${key}`;

  const body = await getText(url);
  const parsed = JSON.parse(body) as {
    items?: Array<{ id: string; snippet?: any; statistics?: Record<string, string> }>;
  };
  let item = parsed.items?.[0];

  if (!item) {
    // forHandle misses legacy custom URLs — fall back to search.
    const searchBody = await getText(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(handle)}&key=${key}`,
    );
    const search = JSON.parse(searchBody) as {
      items?: Array<{ id?: { channelId?: string } }>;
    };
    const channelId = search.items?.[0]?.id?.channelId;
    if (!channelId) throw new Error("Canal do YouTube não encontrado");
    const again = await getText(`${base}&id=${encodeURIComponent(channelId)}&key=${key}`);
    item = (JSON.parse(again) as { items?: any[] }).items?.[0];
  }
  if (!item) throw new Error("Canal do YouTube não encontrado");

  const stats = item.statistics ?? {};
  const toNum = (value?: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  return {
    handle: item.snippet?.customUrl?.replace(/^@/, "") ?? handle,
    displayName: item.snippet?.title ?? null,
    avatarUrl:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.default?.url ??
      null,
    profileUrl: `https://www.youtube.com/channel/${item.id}`,
    followers: toNum(stats["subscriberCount"]),
    following: null,
    postsCount: toNum(stats["videoCount"]),
    likes: null,
    views: toNum(stats["viewCount"]),
    raw: { source: "youtube_api", channelId: item.id, title: item.snippet?.title ?? null },
  };
}

export async function collectPublicMetrics(
  network: Network,
  handle: string,
): Promise<PublicMetrics> {
  switch (network) {
    case "instagram":
      return fetchInstagramPublic(handle);
    case "tiktok":
      return fetchTikTokPublic(handle);
    case "youtube":
      return fetchYouTubePublic(handle);
    case "facebook":
      return fetchFacebookPublic(handle);
    default:
      throw new Error("Coleta automática indisponível para esta rede");
  }
}


/**
 * Copies the public profile picture into our own storage, because the networks
 * block hotlinking. Returns the app URL that serves it, or null on failure.
 */
export async function storeSocialAvatar(
  accountId: string,
  remoteUrl: string | null,
): Promise<string | null> {
  if (!remoteUrl) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isFacebookCrawlerImage = /lookaside\.fbsbx\.com\/lookaside\/crawler/i.test(remoteUrl);
    const response = await fetch(remoteUrl, {
      headers: { "User-Agent": isFacebookCrawlerImage ? CRAWLER_UA : BROWSER_UA },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
    if (!contentType?.startsWith("image/")) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.byteLength) return null;
    const path = `social/${accountId}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from("profile-images")
      .upload(path, bytes, { contentType, upsert: true });
    if (error) return null;
    return `/api/public/img/${path}?v=${Date.now()}`;
  } catch {
    return null;
  }
}

/**
 * Collects the public numbers for one saved account, stores a snapshot and
 * refreshes the public metric row. Uses the admin client because it also runs
 * from the cron route where there is no user session.
 */
export async function syncSocialAccount(accountRowId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: account, error } = await supabaseAdmin
    .from("social_accounts")
    .select("id, profile_id, network, handle")
    .eq("id", accountRowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account) throw new Error("Rede não encontrada");
  if (!account.handle) throw new Error("Informe o @ da rede antes de atualizar");

  try {
    const metrics = await collectPublicMetrics(account.network, account.handle);
    const now = new Date().toISOString();

    await supabaseAdmin.from("social_snapshots").insert({
      social_account_id: account.id,
      followers: metrics.followers,
      following: metrics.following,
      posts_count: metrics.postsCount,
      avg_likes: metrics.likes,
      avg_views: metrics.views,
      raw: metrics.raw as never,
    });

    const avatarUrl = await storeSocialAvatar(account.id, metrics.avatarUrl);

    await supabaseAdmin
      .from("social_accounts")
      .update({
        sync_status: "ok",
        sync_error: null,
        last_synced_at: now,
        profile_url: metrics.profileUrl,
        is_declared: false,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...(cleanDisplayName(metrics.displayName)
          ? { display_name: cleanDisplayName(metrics.displayName) }
          : {}),
      })
      .eq("id", account.id);

    return { ok: true as const, followers: metrics.followers, network: account.network, error: null as string | null };
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
    return {
      ok: false as const,
      followers: null,
      network: account.network,
      error: message,
    };
  }
}

/** Best-effort sync of every saved network of one profile. */
export async function syncProfileAccounts(profileId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: accounts } = await supabaseAdmin
    .from("social_accounts")
    .select("id, network")
    .eq("profile_id", profileId)
    .eq("is_declared", false)
    .not("handle", "is", null);

  const results: Array<{ network: string; ok: boolean; error?: string }> = [];
  for (const account of accounts ?? []) {
    try {
      const result = await syncSocialAccount(account.id);
      results.push({
        network: account.network,
        ok: result.ok,
        ...(result.ok ? {} : { error: result.error ?? "Erro desconhecido" }),
      });
    } catch (error) {
      results.push({
        network: account.network,
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
  return results;
}
