import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { tierLabel, tierRank } from "@/lib/tiers";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MetricRow = Database["public"]["Tables"]["profile_metrics"]["Row"];

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
  index = 0,
}: {
  profile: ProfileRow;
  metrics: MetricRow[];
  index?: number;
}) {
  const ig = metrics.find((m) => m.network === "instagram")?.followers ?? "—";
  const tt = metrics.find((m) => m.network === "tiktok")?.followers ?? "—";
  const topFormat = "Reels";

  return (
    <div className="group flex flex-col overflow-hidden rounded-[20px] border border-border bg-card transition hover:-translate-y-1 hover:border-[#cfe4d3] hover:shadow-[0_22px_40px_-22px_rgba(13,68,36,0.35)]">
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-extrabold text-white ${GRADIENTS[index % GRADIENTS.length]}`}
          >
            {initials(profile.display_name)}
          </div>
          <TierBadge tier={profile.tier} />
        </div>
        <h3 className="mt-3.5 text-lg font-bold text-foreground">{profile.display_name}</h3>
        <p className="mt-0.5 text-xs font-semibold text-primary">{profile.niche}</p>
        <p className="mt-2.5 min-h-[52px] text-[13px] leading-relaxed text-muted-foreground">
          {profile.bio ?? "Sem descrição"}
        </p>
      </div>

      <div className="flex gap-2.5 px-5 py-4">
        <StatLens value={ig} label="INSTA" />
        <StatLens value={tt} label="TIKTOK" />
        <StatLens value={topFormat} label="FORMATO" />
      </div>

      <div className="mt-auto flex border-t border-border">
        <Link
          to="/$slug"
          params={{ slug: profile.slug }}
          className="flex-1 py-3.5 text-center text-[13px] font-bold text-foreground transition hover:bg-secondary"
        >
          Ver perfil
        </Link>
        <a
          href={`https://wa.me/${profile.whatsapp?.replace(/\D/g, "") ?? ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 border-l border-border py-3.5 text-center text-[13px] font-bold text-primary transition hover:bg-secondary"
        >
          Falar agora
        </a>
      </div>
    </div>
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
