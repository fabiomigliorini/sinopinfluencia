export const NETWORKS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X / Twitter" },
  { value: "kwai", label: "Kwai" },
  { value: "linkedin", label: "LinkedIn" },
] as const;

export const FORMAT_OPTIONS = [
  "Reels",
  "Stories",
  "TikTok",
  "UGC",
  "Vídeo longo",
  "Presença em evento",
  "Review de produto",
  "Live",
  "Fotografia",
  "Blog / texto",
];

export const networkLabel = (value?: string | null) =>
  NETWORKS.find((n) => n.value === value)?.label ?? null;

export const fieldCls =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary";
export const labelCls =
  "text-xs font-bold uppercase tracking-widest text-muted-foreground";

export const NICHE_OPTIONS = [
  "Gastronomia",
  "Moda",
  "Beleza",
  "Agro",
  "Fitness",
  "Saúde e bem-estar",
  "Maternidade",
  "Humor",
  "Lifestyle",
  "Viagem",
  "Automotivo",
  "Imóveis",
  "Educação",
  "Tecnologia",
  "Games",
  "Música",
  "Eventos",
  "Pets",
  "Decoração",
  "Negócios e empreendedorismo",
  "Finanças",
  "Esportes",
  "Infantil",
  "Sustentabilidade",
  "Política",
  "Marketing",
];

/** profiles.niche stores a comma separated list of niches. */
export const splitNiches = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const joinNiches = (niches: string[]) =>
  Array.from(new Set(niches.map((n) => n.trim()).filter(Boolean))).join(", ");

/** Turns any text into a URL friendly slug: "Fábio Migliorini" -> "fabio-migliorini". */
export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);
}
