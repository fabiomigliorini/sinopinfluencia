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
