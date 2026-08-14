import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Network = Database["public"]["Enums"]["social_network"];
type ProfileStatus = Database["public"]["Enums"]["profile_status"];

const networkEnum = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "twitter",
  "kwai",
  "linkedin",
]);

const profileInput = z.object({
  display_name: z.string().min(2, "Informe seu nome público"),
  full_name: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  bio: z.string().max(1200).optional().nullable(),
  main_network: networkEnum.optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  avatar_url: z.string().optional().nullable(),
  metrics: z
    .array(
      z.object({
        network: networkEnum,
        followers: z.string().optional().nullable(),
        audience_pct: z.number().min(0).max(100).optional().nullable(),
      }),
    )
    .default([]),
  formats: z.array(z.string().min(1)).default([]),
  brands: z.array(z.string().min(1)).default([]),
  works: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        image_url: z.string().optional().nullable(),
      }),
    )
    .default([]),
});

export type ProfileInput = z.infer<typeof profileInput>;

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!profile) return null;

    const [{ data: metrics }, { data: formats }, { data: works }, { data: brands }] =
      await Promise.all([
        supabase.from("profile_metrics").select("*").eq("profile_id", profile.id),
        supabase.from("profile_formats").select("*").eq("profile_id", profile.id),
        supabase
          .from("profile_works")
          .select("*")
          .eq("profile_id", profile.id)
          .order("sort_order", { ascending: true }),
        supabase.from("profile_brands").select("*").eq("profile_id", profile.id),
      ]);

    return {
      profile,
      metrics: metrics ?? [],
      formats: formats ?? [],
      works: works ?? [],
      brands: brands ?? [],
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => profileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!existing) throw new Error("Perfil não encontrado");

    const profileId = existing.id;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        full_name: data.full_name ?? null,
        niche: data.niche ?? null,
        city: data.city ?? null,
        bio: data.bio ?? null,
        main_network: (data.main_network ?? null) as Network | null,
        whatsapp: data.whatsapp ?? null,
        email: data.email || null,
        avatar_url: data.avatar_url ?? null,
      })
      .eq("id", profileId);
    if (updateError) throw new Error(updateError.message);

    await Promise.all([
      supabase.from("profile_formats").delete().eq("profile_id", profileId),
      supabase.from("profile_works").delete().eq("profile_id", profileId),
      supabase.from("profile_brands").delete().eq("profile_id", profileId),
    ]);

    if (data.formats.length) {
      await supabase.from("profile_formats").insert(
        data.formats.map((format) => ({ profile_id: profileId, format })),
      );
    }
    if (data.brands.length) {
      await supabase.from("profile_brands").insert(
        data.brands.map((brand_name) => ({ profile_id: profileId, brand_name })),
      );
    }
    if (data.works.length) {
      await supabase.from("profile_works").insert(
        data.works.map((w, index) => ({
          profile_id: profileId,
          title: w.title,
          description: w.description ?? null,
          image_url: w.image_url ?? null,
          sort_order: index,
        })),
      );
    }

    return { ok: true };
  });

export const submitMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ status: "pending", submitted_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { isAdmin: (data ?? []).some((r) => r.role === "admin") };
  });

async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = (data ?? []).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden");
}

export const listProfilesForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setProfileStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        status: z.enum(["draft", "pending", "approved", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: {
      status: ProfileStatus;
      approved_at: string | null;
      approved_by: string | null;
    } = {
      status: data.status as ProfileStatus,
      approved_at: data.status === "approved" ? new Date().toISOString() : null,
      approved_by: data.status === "approved" ? context.userId : null,
    };
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Curation panel: sets the ACES tier (1 to 4 stars) of one profile. */
export const setProfileTier = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        tier: z.enum(["creator", "reference", "icon", "featured"]),
      })
      .parse(input),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({ tier: data.tier })
      .eq("id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Curation panel: full profile content of any profile, whatever its status. */
export const getProfileForAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabase } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.profileId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Perfil não encontrado");

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
