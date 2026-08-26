import type { Database } from "@/integrations/supabase/types";
import type { DirectoryMetric } from "@/lib/directory-maps";
import { TierBadge } from "./ProfileCard";

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

function compact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return num.toLocaleString("pt-BR");
}

function totalFollowers(metrics: DirectoryMetric[]): number {
  return metrics.reduce((sum, m) => {
    const n = Number(m.followers ?? 0);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
}

export function CreatorCardMedia({
  profile,
  metrics,
  index = 0,
  showName = true,
  aspectClass = "aspect-[3/4]",
}: {
  profile: ProfileRow;
  metrics: DirectoryMetric[];
  index?: number;
  showName?: boolean;
  aspectClass?: string;
}) {
  const followers = totalFollowers(metrics);

  return (
    <div className={`relative ${aspectClass} w-full overflow-hidden`}>
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.display_name}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
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
        {followers > 0 ? (
          <div className="rounded-lg border border-white/25 bg-[var(--brand-dark)]/70 px-2 py-1 shadow-lg shadow-black/20 backdrop-blur-xl sm:rounded-xl sm:px-2.5 sm:py-1.5">
            <p className="text-xs font-semibold leading-none text-white sm:text-sm">{compact(followers)}</p>
          </div>
        ) : (
          <span />
        )}

        <TierBadge tier={profile.tier} light compact />
      </div>

      {/* Floating name at bottom */}
      {showName ? (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="inline-block rounded-xl border border-white/25 bg-[var(--brand-dark)]/70 px-3 py-2 backdrop-blur-xl">
            <h3 className="truncate text-xs font-medium leading-tight text-white sm:text-sm">
              {profile.display_name}
            </h3>
          </div>
        </div>
      ) : null}
    </div>
  );
}
