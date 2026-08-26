import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import type { DirectoryMetric } from "@/lib/directory-maps";
import { CreatorCardMedia } from "./CreatorCardMedia";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i]!, list[j]!] = [list[j]!, list[i]!];
  }
  return list;
}

function CarouselCard({ profile, metrics, index }: { profile: ProfileRow; metrics: DirectoryMetric[]; index: number }) {
  return (
    <Link
      to="/criador/$slug"
      params={{ slug: profile.slug }}
      className="group relative block w-[240px] shrink-0 overflow-hidden rounded-[26px] border border-white/15 shadow-2xl shadow-black/20 transition-all duration-500 hover:z-10 hover:scale-[1.03] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] sm:w-[270px]"
    >
      <CreatorCardMedia profile={profile} metrics={metrics} index={index} aspectClass="aspect-[3/4]" />
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
