import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sortByTier } from "@/lib/tiers";
import { loadPublicSocialAccounts } from "@/lib/social-public";


function createServerSupabaseClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export const listProfiles = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createServerSupabaseClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "approved");

    if (error) throw new Error(error.message);
    return sortByTier(profiles ?? []);
  },
);

import { z } from "zod";

const filterSchema = z.object({
  q: z.string().optional(),
  niche: z.string().optional(),
  network: z.string().optional(),
  tier: z.string().optional(),
});

export const getFilteredProfiles = createServerFn({ method: "GET" })
  .validator((input: Record<string, string | undefined>) =>
    filterSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    let builder = supabase
      .from("profiles")
      .select("*")
      .eq("status", "approved");

    if (data.q) {
      builder = builder.or(
        `display_name.ilike.%${data.q}%,bio.ilike.%${data.q}%,niche.ilike.%${data.q}%`,
      );
    }
    if (data.niche) {
      builder = builder.ilike("niche", `%${data.niche}%`);
    }
    if (data.network) {
      builder = builder.eq(
        "main_network",
        data.network as Database["public"]["Enums"]["social_network"],
      );
    }
    if (data.tier) {
      builder = builder.eq(
        "tier",
        data.tier as Database["public"]["Enums"]["tier"],
      );
    }

    const { data: profiles, error } = await builder;

    if (error) throw new Error(error.message);
    return sortByTier(profiles ?? []);
  });

export const listDirectoryMetadata = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createServerSupabaseClient();
    const [{ data: profiles }, { data: accounts }, { data: formats }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, niche, tier")
          .eq("status", "approved"),
        supabase
          .from("social_accounts")
          .select("id, profile_id, network"),
        supabase.from("profile_formats").select("profile_id, format"),
      ]);

    const accountRows = accounts ?? [];
    const { data: snapshots } = accountRows.length
      ? await supabase
          .from("social_snapshots")
          .select("social_account_id, followers, captured_at")
          .in(
            "social_account_id",
            accountRows.map((a) => a.id),
          )
          .order("captured_at", { ascending: false })
      : { data: [] as Array<{ social_account_id: string; followers: number | null }> };

    const metrics = accountRows.map((account) => {
      const latest = (snapshots ?? []).find((s) => s.social_account_id === account.id);
      const followers =
        latest?.followers != null && latest.followers > 0 ? compactNumber(latest.followers) : null;
      return { profile_id: account.profile_id, network: account.network as string, followers };
    });
    console.log("[DEBUG listDirectoryMetadata] accounts:", accountRows.length, "snapshots:", snapshots?.length, "metrics sample:", metrics.filter(m => m.profile_id === '8edf29e2-a9ff-46e1-8abe-b0ed28047e22'));
    const niches = Array.from(
      new Set(
        (profiles ?? []).flatMap((p) =>
          (p.niche ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return {
      niches,
      metrics,
      formats: formats ?? [],
      count: (profiles ?? []).length,
    };
  },
);


export const getProfileBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "approved")
      .single();

    if (profileError || !profile) {
      return null;
    }

    const [
      { data: formats },
      { data: works },
      { data: brands },
      socialAccounts,
    ] = await Promise.all([
      supabase
        .from("profile_formats")
        .select("*")
        .eq("profile_id", profile.id)
        .order("format", { ascending: true }),
      supabase
        .from("profile_works")
        .select("*")
        .eq("profile_id", profile.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profile_brands")
        .select("*")
        .eq("profile_id", profile.id)
        .order("brand_name", { ascending: true }),
      loadPublicSocialAccounts(supabase, profile.id),
    ]);

    return {
      profile,
      formats: formats ?? [],
      works: works ?? [],
      brands: brands ?? [],
      socialAccounts,
    };
  });



/** Short follower label (1.2K / 3.4M) used by the directory cards. */
function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}
