import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { tierLabel, tierRank } from "@/lib/tiers";
import type { DirectoryMetric } from "@/lib/directory-maps";
import { NETWORK_META, NETWORK_ORDER, type NetworkId } from "@/components/network-icons";
import { CreatorCardMedia } from "./CreatorCardMedia";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function Pin({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 28" aria-hidden="true">
      <path
        d="M12 2c5 0 9 3.6 9 9 0 6-9 15-9 15s-9-9-9-15c0-5.4 4-9 9-9z"
        fill={filled ? "currentColor" : "rgba(255,255,255,0.25)"}
      />
    </svg>
  );
}

export function TierBadge({
  tier,
  light = false,
  compact = false,
}: {
  tier: string;
  light?: boolean;
  compact?: boolean;
}) {
  const order = tierRank(tier);
  return (
    <div
      className={`flex flex-col items-start gap-0.5 rounded-xl px-2 py-1 sm:rounded-2xl sm:px-2.5 sm:py-1.5 ${
        light
          ? "bg-[var(--brand-dark)]/70 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/20"
          : "bg-secondary"
      }`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pin
            key={i}
            filled={i < order}
            className={`h-2.5 w-2 sm:h-3 sm:w-2.5 ${i < order ? "text-white" : "text-white/25"}`}
          />
        ))}
      </div>
    </div>
  );
}

function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "—") return "—";
  const num = typeof value === "string" ? Number(value.replace(/\D/g, "")) : Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return num.toLocaleString("pt-BR");
}

function NetworkIconButton({ network, highlight = false }: { network: NetworkId; highlight?: boolean }) {
  const meta = NETWORK_META[network] ?? NETWORK_META.instagram;
  const { Icon } = meta;

  return (
    <span
      title={meta.label}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-300 sm:h-8 sm:w-8 sm:rounded-xl ${
        highlight
          ? "border-[#FFEB00]/40 bg-white/5 text-[#FFEB00] group-hover:bg-[#FFEB00] group-hover:text-[#1a1a1a]"
          : "border-white/10 bg-white/5 text-white group-hover:bg-white group-hover:text-[var(--brand-dark)]"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function ProfileCard({
  profile,
  metrics,
  formats = [],
  index = 0,
}: {
  profile: ProfileRow;
  metrics: DirectoryMetric[];
  formats?: string[];
  index?: number;
}) {
  const niches = (profile.niche ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  const networksWithHandles = metrics.map((m) => m.network as NetworkId).filter((n) => NETWORK_META[n]);

  const orderedNetworks = NETWORK_ORDER.filter((n) => networksWithHandles.includes(n));
  const baseNetworks = orderedNetworks.length > 0 ? orderedNetworks : networksWithHandles;
  const availableNetworks = [...new Set(baseNetworks)].sort(
    (a, b) => (a === profile.main_network ? 0 : 1) - (b === profile.main_network ? 0 : 1),
  );

  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group relative z-0 flex flex-col overflow-hidden rounded-[20px] border border-white/20 bg-[radial-gradient(circle_at_70%_-20%,#14622f_0%,#0D4424_60%)] shadow-2xl shadow-black/20 transition-all duration-500 hover:z-10 hover:scale-105 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)] sm:rounded-[28px]"
    >
      {/* Organic glow blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFEB00]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#FFEB00]/10 blur-3xl" />

      {/* Shared photo + badges + name */}
      <CreatorCardMedia profile={profile} metrics={metrics} index={index} aspectClass="aspect-[3/4]" />

      {/* Glassmorphism content at bottom, organic fade into card background */}
      <div className="relative flex-1 bg-[radial-gradient(circle_at_70%_-20%,#14622f_0%,#0D4424_60%)] px-3 pb-3 pt-2.5 sm:px-5 sm:pb-5 sm:pt-4">
        {/* Networks first */}
        {availableNetworks.length > 0 ? (
          <div className="mb-2 flex flex-nowrap items-center gap-1 overflow-hidden sm:mb-2.5 sm:gap-1.5">
            {availableNetworks.slice(0, 4).map((network) => (
              <NetworkIconButton key={network} network={network} highlight={network === profile.main_network} />
            ))}
            {availableNetworks.length > 4 ? (
              <span className="text-[10px] font-bold text-white/60 sm:text-xs">+{availableNetworks.length - 4}</span>
            ) : null}
          </div>
        ) : null}

        {/* Categories second */}
        {niches.length > 0 ? (
          <div className="mb-2.5 flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden sm:mb-3 sm:gap-1.5">
            <span className="max-w-full truncate rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-white backdrop-blur-xl sm:px-2.5 sm:py-1 sm:text-[9.5px]">
              {niches[0]}
            </span>
            {niches.length > 1 ? (
              <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-white backdrop-blur-xl sm:px-2.5 sm:py-1 sm:text-[9.5px]">
                +{niches.length - 1}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Full card description (tagline) */}
        {profile.tagline ? (
          <p className="text-xs font-medium leading-relaxed text-white/80 sm:text-[13px]">{profile.tagline}</p>
        ) : null}
      </div>
    </Link>
  );
}
