import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
      .eq("status", "approved")
      .order("tier", { ascending: false })
      .order("display_name", { ascending: true });

    if (error) throw new Error(error.message);
    return profiles ?? [];
  },
);

export const getProfileBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "approved")
      .single();

    if (profileError || !profile) {
      throw new Error("Perfil não encontrado");
    }

    const [{ data: metrics }, { data: formats }, { data: works }, { data: brands }] =
      await Promise.all([
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
