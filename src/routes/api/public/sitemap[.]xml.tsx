import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SITE_URL = "https://sinopinfluencia.lovable.app";

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                h.delete("Authorization");
              }
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const { data } = await supabase
          .from("profiles")
          .select("slug, updated_at")
          .eq("status", "approved");

        const staticUrls = ["", "/vitrine", "/auth"];
        const urls = [
          ...staticUrls.map(
            (path) =>
              `<url><loc>${SITE_URL}${path}</loc><changefreq>weekly</changefreq><priority>${
                path === "" ? "1.0" : "0.8"
              }</priority></url>`,
          ),
          ...(data ?? []).map(
            (p) =>
              `<url><loc>${SITE_URL}/criador/${p.slug}</loc><lastmod>${new Date(
                p.updated_at,
              ).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
          ),
        ].join("");

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "cache-control": "public, max-age=3600",
            },
          },
        );
      },
    },
  },
});
