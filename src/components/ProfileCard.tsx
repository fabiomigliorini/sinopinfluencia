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
            className={`h-2.5 w-2 sm:h-3 sm:w-2.5 ${i < order ? "text-[#FFEB00]" : "text-white/25"}`}
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

  const totalFollowers = metrics.reduce((sum, m) => {
    const n = Number(m.followers ?? 0);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const totalValue = totalFollowers > 0 ? formatNumber(totalFollowers) : undefined;

  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group relative z-0 flex flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/20 bg-gradient-to-b from-[var(--brand-green-deep)] to-[var(--brand-dark)] shadow-2xl shadow-black/20 transition-all duration-500 hover:z-10 hover:scale-[1.03] hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]"
    >
      {/* Photo area: flex-1 so it never sits under the content overlay */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
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

        {/* Top badges: followers and tier */}
        <div className="absolute left-2 right-2 top-2 flex items-start justify-between sm:left-3 sm:right-3 sm:top-3">
          {totalValue ? (
            <div className="rounded-lg border border-white/25 bg-[var(--brand-dark)]/70 px-2 py-1 shadow-lg shadow-black/20 backdrop-blur-xl sm:rounded-xl sm:px-2.5 sm:py-1.5">
              <p className="text-xs font-black leading-none text-[#FFEB00] sm:text-sm">{totalValue}</p>
            </div>
          ) : (
            <span />
          )}

          <TierBadge tier={profile.tier} light compact />
        </div>

        {/* Floating name at bottom, like carousel */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="inline-block rounded-xl border border-white/25 bg-[var(--brand-dark)]/70 px-3 py-2 backdrop-blur-xl">
            <h3 className="truncate text-sm font-extrabold leading-tight tracking-tight text-white sm:text-lg">
              {profile.display_name}
            </h3>
          </div>
        </div>
      </div>

      {/* Glassmorphism content at bottom, in flow so it never covers the photo */}
      <div className="border-t border-white/10 bg-[var(--brand-dark)]/60 px-3 pb-3 pt-2.5 backdrop-blur-2xl sm:px-5 sm:pb-5 sm:pt-4">
        {niches.length > 0 ? (
          <div className="mb-2 flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden sm:mb-2.5 sm:gap-1.5">
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

        {/* Networks below */}
        {availableNetworks.length > 0 ? (
          <div className="mb-2.5 flex flex-nowrap items-center gap-1 overflow-hidden sm:mb-3 sm:gap-1.5">
            {availableNetworks.slice(0, 4).map((network) => (
              <NetworkIconButton key={network} network={network} highlight={network === profile.main_network} />
            ))}
            {availableNetworks.length > 4 ? (
              <span className="text-[10px] font-bold text-white/60 sm:text-xs">+{availableNetworks.length - 4}</span>
            ) : null}
          </div>
        ) : null}

        {/* Short card description (tagline), limited to 2 lines */}
        {profile.tagline ? (
          <div className="hidden sm:block">
            <p className="!bio-clamp mt-2 text-sm font-medium leading-relaxed text-white/80">{profile.tagline}</p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
