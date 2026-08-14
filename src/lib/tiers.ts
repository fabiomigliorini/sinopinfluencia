import type { Database } from "@/integrations/supabase/types";

export type Tier = Database["public"]["Enums"]["tier"];

/** Official ACES ladder: 1 star = Criador ... 4 stars = Destaque. */
export const TIER_RANK: Record<Tier, number> = {
  creator: 1,
  reference: 2,
  icon: 3,
  featured: 4,
};

export const TIER_LABEL: Record<Tier, string> = {
  creator: "Criador",
  reference: "Referência",
  icon: "Ícone",
  featured: "Destaque",
};

/** Ordered from 1 to 4 stars, for selects and filters. */
export const TIER_OPTIONS: { value: Tier; label: string; stars: number }[] = (
  ["creator", "reference", "icon", "featured"] as Tier[]
).map((value) => ({ value, label: TIER_LABEL[value], stars: TIER_RANK[value] }));

export function tierRank(tier: string | null | undefined) {
  return TIER_RANK[(tier ?? "creator") as Tier] ?? 1;
}

export function tierLabel(tier: string | null | undefined) {
  return TIER_LABEL[(tier ?? "creator") as Tier] ?? String(tier ?? "");
}

/** Sorts profiles by the official ACES ladder (4 stars first), then by name. */
export function sortByTier<T extends { tier: string; display_name: string }>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      tierRank(b.tier) - tierRank(a.tier) ||
      a.display_name.localeCompare(b.display_name, "pt-BR"),
  );
}
