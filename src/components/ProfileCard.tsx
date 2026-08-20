import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { tierLabel, tierRank } from "@/lib/tiers";
import type { DirectoryMetric } from "@/lib/directory-maps";
import { NETWORK_META, NETWORK_ORDER, type NetworkId } from "@/components/network-icons";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const GRADIENTS = [
  "from-green-950 to-emerald-900",
  "from-emerald-950 to-green-900",
  "from-[#0f3d24] to-[#145c32]",
  "from-[#143d22] to-[#1a5230]",
  "from-green-900 to-emerald-950",
  "from-[#0d3b20] to-[#124f2a]",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

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

export function TierBadge({ tier, light = false }: { tier: string; light?: boolean }) {
  const order = tierRank(tier);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 ${
        light
          ? "bg-white/10 backdrop-blur-xl border border-white/20"
          : "bg-secondary"
      }`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pin
            key={i}
            filled={i < order}
            className={`h-2.5 w-2 ${
              i < order ? "text-[#FFEB00]" : "text-white/25"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-wide ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {tierLabel(tier)}
      </span>
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

function NetworkIconButton({
  network,
  highlight = false,
}: {
  network: NetworkId;
  highlight?: boolean;
}) {
  const meta = NETWORK_META[network] ?? NETWORK_META.instagram;
  const { Icon } = meta;

  return (
    <span
      title={meta.label}
      className={`grid h-10 w-10 place-items-center rounded-2xl border transition-all duration-300 ${
        highlight
          ? "border-[#FFEB00]/40 bg-[#FFEB00] text-[#1a1a1a]"
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

  const networksWithHandles = metrics
    .map((m) => m.network as NetworkId)
    .filter((n) => NETWORK_META[n]);

  const orderedNetworks = NETWORK_ORDER.filter((n) => networksWithHandles.includes(n));
  const baseNetworks = orderedNetworks.length > 0 ? orderedNetworks : networksWithHandles;
  const availableNetworks = [...new Set(baseNetworks)].sort(
    (a, b) =>
      (a === profile.main_network ? 0 : 1) - (b === profile.main_network ? 0 : 1),
  );

  const totalFollowers = metrics.reduce((sum, m) => {
    const n = Number(m.followers ?? 0);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const totalValue = totalFollowers > 0 ? formatNumber(totalFollowers) : undefined;

  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-b from-[var(--brand-green-deep)] to-[var(--brand-dark)] shadow-2xl shadow-black/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]"
    >
      {/* Photo area: larger, 3:4 aspect ratio */}
      <div className="relative aspect-[7/10] overflow-hidden">
        {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              loading="lazy"
              className="h-full w-full object-cover object-[center_top] transition-transform duration-700 group-hover:scale-110"
            />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-5xl font-extrabold text-white ${
              GRADIENTS[index % GRADIENTS.length]
            }`}
          >
            {initials(profile.display_name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)]/80 via-transparent to-transparent" />

        {/* Top-left total followers */}
        {totalValue ? (
          <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-white/10 px-3 py-1.5 text-left backdrop-blur-xl">
            <p className="text-base font-black leading-none text-white">{totalValue}</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">
              Seguidores
            </p>
          </div>
        ) : null}

        {/* Top-right tier badge */}
        <div className="absolute top-4 right-4">
          <TierBadge tier={profile.tier} light />
        </div>
      </div>

      {/* Glassmorphism content overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[var(--brand-dark)]/60 px-5 pb-5 pt-4 backdrop-blur-2xl">
        {niches.length > 0 ? (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {niches.slice(0, 3).map((n) => (
              <span
                key={n}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-widest text-white backdrop-blur-xl"
              >
                {n}
              </span>
            ))}
            {niches.length > 3 ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                +{niches.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}

        <h3 className="truncate text-xl font-extrabold leading-tight tracking-tight text-white">
          {profile.display_name}
        </h3>
        {profile.city ? (
          <p className="mt-0.5 text-xs font-semibold text-white/70">{profile.city}</p>
        ) : null}

        {/* Short card description (tagline), limited to 2 lines */}
        {profile.tagline ? (
          <p className="!bio-clamp mt-2 text-sm font-medium leading-relaxed text-white/80">
            {profile.tagline}
          </p>
        ) : null}

        {/* Redesigned social icons */}
        {availableNetworks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {availableNetworks.slice(0, 4).map((network) => (
              <NetworkIconButton
                key={network}
                network={network}
                highlight={network === profile.main_network}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
