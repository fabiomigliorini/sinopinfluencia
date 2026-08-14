import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_HOSTS = [
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "facebook.com",
  "www.facebook.com",
  "fb.watch",
  "m.facebook.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "kwai.com",
  "www.kwai.com",
];

const input = z.object({ url: z.string().url() });

function meta(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return null;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function youtubeId(url: URL) {
  if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1);
  if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] ?? null;
  return url.searchParams.get("v");
}

/** Reads public Open Graph metadata of a social post and stores its cover image. */
export const fetchLinkPreview = createServerFn({ method: "POST" })
  .validator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }) => {
    let url: URL;
    try {
      url = new URL(data.url);
    } catch {
      return { ok: false as const, error: "URL inválida" };
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false as const, error: "URL inválida" };
    }
    if (!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) {
      return {
        ok: false as const,
        error: "Use um link do Instagram, TikTok, Facebook, YouTube ou Kwai",
      };
    }

    let title: string | null = null;
    let image: string | null = null;

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; SinopInfluenciaBot/1.0; +https://sinopinfluencia.lovable.app)",
          "accept-language": "pt-BR,pt;q=0.9",
        },
      });
      if (response.ok) {
        const html = await response.text();
        title = meta(html, "og:title") ?? meta(html, "twitter:title");
        image = meta(html, "og:image") ?? meta(html, "twitter:image");
      }
    } catch {
      // ignore; fallbacks below
    }

    if (!image) {
      const id = url.hostname.includes("you") ? youtubeId(url) : null;
      if (id) image = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    if (!image) {
      return {
        ok: false as const,
        error: "Não conseguimos importar a capa deste link. Envie a imagem manualmente.",
      };
    }

    // Store a local copy so the preview never breaks by hotlink restrictions.
    let storedUrl: string | null = null;
    try {
      const imageResponse = await fetch(image, {
        headers: { referer: url.origin + "/" },
      });
      if (imageResponse.ok) {
        const bytes = new Uint8Array(await imageResponse.arrayBuffer());
        if (bytes.byteLength > 0 && bytes.byteLength < 8 * 1024 * 1024) {
          const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const path = `previews/${crypto.randomUUID()}.jpg`;
          const { error } = await supabaseAdmin.storage
            .from("profile-images")
            .upload(path, bytes, { contentType, upsert: false });
          if (!error) storedUrl = `/api/public/img/${path}`;
        }
      }
    } catch {
      // fall back to the remote URL
    }

    return {
      ok: true as const,
      title: title ? title.slice(0, 160) : null,
      image: storedUrl ?? image,
    };
  });
