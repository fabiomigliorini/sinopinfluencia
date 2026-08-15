import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { tierLabel, tierRank } from "@/lib/tiers";
import type { DirectoryMetric } from "@/lib/directory-maps";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];


const GRADIENTS = [
  "from-emerald-500 to-green-800",
  "from-yellow-300 to-emerald-500",
  "from-green-900 to-emerald-500",
  "from-green-800 to-green-950",
  "from-emerald-500 to-green-900",
  "from-yellow-300 to-green-800",
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
        fill={filled ? "currentColor" : "#DCE7DE"}
      />
    </svg>
  );
}

export function TierBadge({ tier, light = false }: { tier: string; light?: boolean }) {
  const order = tierRank(tier);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 ${
        light ? "bg-white/10" : "bg-secondary"
      }`}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pin
            key={i}
            filled={i < order}
            className={`h-2.5 w-2 ${i < order ? (light ? "text-[#FFEB00]" : "text-[#FFEB00]") : "text-[#DCE7DE]"}`}
          />
        ))}
      </div>
      <span className={`text-[10.5px] font-bold uppercase tracking-wide ${light ? "text-white" : "text-foreground"}`}>
        {tierLabel(tier)}
      </span>
    </div>
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
  const followersOf = (network: string) =>
    metrics.find((m) => m.network === network && m.followers)?.followers ?? "—";
  const ig = followersOf("instagram");
  const tt = followersOf("tiktok");
  const topFormat = formats[0] ?? "—";
  const niches = (profile.niche ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-border bg-card transition hover:-translate-y-1 hover:border-[#cfe4d3] hover:shadow-[0_22px_40px_-22px_rgba(13,68,36,0.35)]"
    >
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div
            className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-lg font-extrabold text-white ${GRADIENTS[index % GRADIENTS.length]}`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              initials(profile.display_name)
            )}
          </div>
          <TierBadge tier={profile.tier} />
        </div>
        <h3 className="mt-3.5 text-lg font-bold text-foreground">{profile.display_name}</h3>
        {niches.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {niches.slice(0, 3).map((n) => (
              <span
                key={n}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-primary"
              >
                {n}
              </span>
            ))}
            {niches.length > 3 ? (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                +{niches.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
        {profile.city ? (
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{profile.city}</p>
        ) : null}
        <p className="mt-2.5 min-h-[52px] text-[13px] leading-relaxed text-muted-foreground">
          {profile.bio ?? "Sem descrição"}
        </p>
      </div>

      <div className="mt-auto flex gap-2.5 px-5 py-4">
        <StatLens value={ig} label="INSTA" />
        <StatLens value={tt} label="TIKTOK" />
        <StatLens value={topFormat} label="FORMATO" />
      </div>
    </Link>
  );
}


function StatLens({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex h-11 w-11 rotate-45 items-center justify-center rounded-xl bg-secondary">
      <div className="-rotate-45 text-center">
        <b className="block text-[11px] font-extrabold leading-none">{value}</b>
        <small className="block text-[7px] font-bold tracking-wide text-muted-foreground">{label}</small>
      </div>
    </div>
  );
}
