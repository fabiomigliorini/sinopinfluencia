import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { tierRank } from "@/lib/tiers";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Sorts by the official ACES ladder (4 stars first), then by name. */
function sortByTier(rows: ProfileRow[]) {
  return [...rows].sort(
    (a, b) =>
      tierRank(b.tier) - tierRank(a.tier) ||
      a.display_name.localeCompare(b.display_name, "pt-BR"),
  );
}

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
      builder = builder.eq("niche", data.niche);
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
    const [{ data: profiles }, { data: metrics }] = await Promise.all([
      supabase.from("profiles").select("id, niche, tier").eq("status", "approved"),
      supabase.from("profile_metrics").select("profile_id, network, followers"),
    ]);
    const niches = Array.from(
      new Set((profiles ?? []).map((p) => p.niche).filter(Boolean)),
    ) as string[];
    return { niches, metrics: metrics ?? [], count: (profiles ?? []).length };
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
      throw notFound();
    }

    const [
      { data: metrics },
      { data: formats },
      { data: works },
      { data: brands },
    ] = await Promise.all([
      supabase
        .from("profile_metrics")
        .select("*")
        .eq("profile_id", profile.id)
        .order("network", { ascending: true }),
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
    ]);

    return {
      profile,
      metrics: metrics ?? [],
      formats: formats ?? [],
      works: works ?? [],
      brands: brands ?? [],
    };
  });

