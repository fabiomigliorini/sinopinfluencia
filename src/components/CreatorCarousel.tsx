import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import type { DirectoryMetric } from "@/lib/directory-maps";
import { TierBadge } from "./ProfileCard";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const GRADIENTS = [
  "from-green-950 to-emerald-900",
  "from-emerald-950 to-green-900",
  "from-[#0f3d24] to-[#145c32]",
  "from-[#143d22] to-[#1a5230]",
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

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i]!, list[j]!] = [list[j]!, list[i]!];
  }
  return list;
}

function CarouselCard({ profile, metrics, index }: { profile: ProfileRow; metrics: DirectoryMetric[]; index: number }) {
  const followers = totalFollowers(metrics);

  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group relative block w-[240px] shrink-0 overflow-hidden rounded-[26px] border border-white/15 shadow-2xl shadow-black/20 transition-all duration-500 hover:z-10 hover:scale-[1.03] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] sm:w-[270px]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
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

        {/* Gradient overlay removed to keep images clean */}

        {/* Top-left: total followers only */}
        {followers > 0 ? (
          <div className="absolute left-3.5 top-3.5 rounded-xl border border-white/25 bg-[var(--brand-dark)]/70 px-2.5 py-1.5 backdrop-blur-xl">
            <p className="text-sm font-black leading-none text-white">{compact(followers)}</p>
          </div>
        ) : null}

        {/* Top-right: tier badge */}
        <div className="absolute right-3.5 top-3.5">
          <TierBadge tier={profile.tier} light />
        </div>

        {/* Bottom: name */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-block rounded-xl border border-white/25 bg-[var(--brand-dark)]/70 px-3 py-2 backdrop-blur-xl">
            <h3 className="truncate text-lg font-extrabold leading-tight tracking-tight text-white">
              {profile.display_name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CreatorCarousel({
  profiles,
  metricsMap,
}: {
  profiles: ProfileRow[];
  metricsMap: Record<string, DirectoryMetric[]>;
}) {
  const [ordered, setOrdered] = useState<ProfileRow[]>(profiles);

  useEffect(() => {
    setOrdered(shuffle(profiles));
  }, [profiles]);

  const track = useMemo(() => [...ordered, ...ordered], [ordered]);
  const duration = Math.max(24, ordered.length * 6);

  if (ordered.length === 0) return null;

  return (
    <div
      className="group/marquee relative overflow-hidden py-6"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div
        className="flex w-max gap-5 group-hover/marquee:[animation-play-state:paused]"
        style={{ animation: `marquee-x ${duration}s linear infinite` }}
      >
        {track.map((profile, i) => (
          <CarouselCard key={`${profile.id}-${i}`} profile={profile} metrics={metricsMap[profile.id] ?? []} index={i} />
        ))}
      </div>
    </div>
  );
}
