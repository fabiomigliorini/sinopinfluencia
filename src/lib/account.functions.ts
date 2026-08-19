import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeSlug } from "@/lib/profile-options";
import { loadPublicSocialAccounts } from "@/lib/social-public";

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
  bio: z.string().max(500).optional().nullable(),
  main_network: networkEnum.optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  avatar_url: z.string().optional().nullable(),
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

export const getMyHeaderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("slug, display_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!profile) return null;
    return profile;
  });

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

    const [{ data: formats }, { data: works }, { data: brands }, socialAccounts] =
      await Promise.all([
        supabase.from("profile_formats").select("*").eq("profile_id", profile.id),
        supabase
          .from("profile_works")
          .select("*")
          .eq("profile_id", profile.id)
          .order("sort_order", { ascending: true }),
        supabase.from("profile_brands").select("*").eq("profile_id", profile.id),
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
        content_changed_at: new Date().toISOString(),
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
    const { data: existing, error: findError } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!existing) throw new Error("Perfil não encontrado");

    // An already published profile stays visible in the directory while the
    // curation team reviews the new changes; it is only flagged for review.
    const alreadyApproved = existing.status === "approved";
    const { error } = await supabase
      .from("profiles")
      .update({
        status: alreadyApproved ? "approved" : "pending",
        review_pending: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { ok: true, keptPublished: alreadyApproved };
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
      review_pending: boolean;
    } = {
      status: data.status as ProfileStatus,
      approved_at: data.status === "approved" ? new Date().toISOString() : null,
      approved_by: data.status === "approved" ? context.userId : null,
      // Any curation decision clears the "changes waiting for review" flag.
      review_pending: false,
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
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        tier: z.enum(["creator", "reference", "icon", "featured"]),
      })
      .parse(input),
  )
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
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
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

    const [{ data: formats }, { data: works }, { data: brands }, socialAccounts] =
      await Promise.all([
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


/** Saves only the profile photo, so the dashboard can change it in one click. */
export const setMyAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ avatarUrl: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: data.avatarUrl || null,
        content_changed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function getMyProfileId(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Perfil não encontrado");
  return data.id;
}

/** Marks the profile as having content changes not yet sent to curation. */
async function touchProfileContent(
  supabase: SupabaseClient<Database>,
  profileId: string,
) {
  await supabase
    .from("profiles")
    .update({ content_changed_at: new Date().toISOString() })
    .eq("id", profileId);
}

const basicsInput = z.object({
  display_name: z.string().min(2, "Informe seu nome público"),
  full_name: z.string().nullable(),
  city: z.string().nullable(),
  tagline: z.string().max(160).nullable(),
  bio: z.string().max(500).nullable(),
  main_network: networkEnum.nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().email("E-mail inválido").nullable().or(z.literal("")),
});

export type BasicsInput = z.infer<typeof basicsInput>;

/** Dialog "Informações básicas": saves only the main profile fields. */
export const updateMyBasics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => basicsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        full_name: data.full_name || null,
        city: data.city || null,
        tagline: data.tagline || null,
        bio: data.bio || null,
        main_network: (data.main_network || null) as Network | null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        content_changed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Dialog "Formatos de trabalho": replaces the whole selection. */
export const setMyFormats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ formats: z.array(z.string().min(1)) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profileId = await getMyProfileId(supabase, userId);
    const { error: deleteError } = await supabase
      .from("profile_formats")
      .delete()
      .eq("profile_id", profileId);
    if (deleteError) throw new Error(deleteError.message);
    const unique = Array.from(new Set(data.formats));
    if (unique.length) {
      const { error } = await supabase
        .from("profile_formats")
        .insert(unique.map((format) => ({ profile_id: profileId, format })));
      if (error) throw new Error(error.message);
    }
    await touchProfileContent(supabase, profileId);
    return { ok: true };
  });

export const addMyBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ brandName: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profileId = await getMyProfileId(supabase, userId);
    const { error } = await supabase
      .from("profile_brands")
      .insert({ profile_id: profileId, brand_name: data.brandName.trim() });
    if (error) throw new Error(error.message);
    await touchProfileContent(supabase, profileId);
    return { ok: true };
  });

export const removeMyBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ brandId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profile_brands")
      .delete()
      .eq("id", data.brandId);
    if (error) throw new Error(error.message);
    await touchProfileContent(
      context.supabase,
      await getMyProfileId(context.supabase, context.userId),
    );
    return { ok: true };
  });

const workInput = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Informe o título do trabalho"),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  link_url: z.string().nullable(),
});

export type WorkInput = z.infer<typeof workInput>;

/** Dialog "Trabalho do portfólio": creates or updates one item. */
export const upsertMyWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => workInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profileId = await getMyProfileId(supabase, userId);
    const payload = {
      title: data.title.trim(),
      description: data.description || null,
      image_url: data.image_url || null,
      link_url: data.link_url || null,
    };

    if (data.id) {
      const { error } = await supabase
        .from("profile_works")
        .update(payload)
        .eq("id", data.id)
        .eq("profile_id", profileId);
      if (error) throw new Error(error.message);
      await touchProfileContent(supabase, profileId);
      return { ok: true };
    }

    const { count } = await supabase
      .from("profile_works")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId);

    const { error } = await supabase
      .from("profile_works")
      .insert({ ...payload, profile_id: profileId, sort_order: count ?? 0 });
    if (error) throw new Error(error.message);
    await touchProfileContent(supabase, profileId);
    return { ok: true };
  });

export const removeMyWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ workId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profile_works")
      .delete()
      .eq("id", data.workId);
    if (error) throw new Error(error.message);
    await touchProfileContent(
      context.supabase,
      await getMyProfileId(context.supabase, context.userId),
    );
    return { ok: true };
  });


/** Card "Nichos": replaces the whole list (stored as a comma separated text). */
export const setMyNiches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ niches: z.array(z.string().min(1).max(60)) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const unique = Array.from(
      new Set(data.niches.map((n) => n.trim()).filter(Boolean)),
    );
    const { error } = await supabase
      .from("profiles")
      .update({
        niche: unique.length ? unique.join(", ") : null,
        content_changed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Card "Informações básicas": changes the public address /criador/<slug>. */
export const setMySlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ slug: z.string().min(3, "Use ao menos 3 caracteres") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const slug = normalizeSlug(data.slug);
    if (slug.length < 3) throw new Error("Endereço inválido. Use letras e números.");

    const { data: taken, error: checkError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("slug", slug)
      .maybeSingle();
    if (checkError) throw new Error(checkError.message);
    if (taken && taken.user_id !== userId) {
      throw new Error("Esse endereço já está em uso. Escolha outro.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ slug, content_changed_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, slug };
  });
