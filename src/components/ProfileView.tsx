import { Link } from "@tanstack/react-router";
import { NetworkBadge, networkLabel } from "@/components/network-icons";
import { TierBadge } from "@/components/ProfileCard";
import type { Database } from "@/integrations/supabase/types";
import type { PublicSocialAccount } from "@/lib/social-public";

type Tables = Database["public"]["Tables"];

export type ProfileViewData = {
  profile: Tables["profiles"]["Row"];
  metrics: Tables["profile_metrics"]["Row"][];
  formats: Tables["profile_formats"]["Row"][];
  works: Tables["profile_works"]["Row"][];
  brands: Tables["profile_brands"]["Row"][];
  socialAccounts?: PublicSocialAccount[];
};

export function ProfileView({
  data,
  backLink,
}: {
  data: ProfileViewData;
  backLink?: React.ReactNode;
}) {
  const { profile, metrics, formats, works, brands } = data;
  const socialAccounts = data.socialAccounts ?? [];

  const avatarInitials = profile.display_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  const niches = (profile.niche ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  // Legacy metric rows (no linked social account) duplicate a network that
  // already has account-based metrics — hide them.
  const networksWithAccountMetrics = new Set(
    metrics.filter((m) => m.social_account_id).map((m) => m.network),
  );
  const visibleMetrics = metrics.filter(
    (m) => m.social_account_id || !networksWithAccountMetrics.has(m.network),
  );




  return (
    <div className="bg-background pb-16 pt-8">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        {backLink ?? (
          <Link
            to="/diretorio"
            search={{}}
            className="inline-flex text-sm font-bold text-primary hover:underline"
          >
            ← Voltar ao diretório
          </Link>
        )}

        <div className="mt-6 overflow-hidden rounded-[26px] bg-card shadow-[0_24px_60px_-28px_rgba(13,68,36,0.25)]">
          <div
            className="relative h-40 md:h-56"
            style={{
              background:
                "linear-gradient(135deg, #0D4424 0%, #14622f 50%, #1E7A3B 100%)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,235,0,0.12),transparent_35%)]" />
            <div className="absolute bottom-0 left-6 flex translate-y-1/2 items-center gap-5 md:left-10">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-[#FFEB00] to-[#D4C200] text-3xl font-extrabold text-[#0D4424] shadow-lg md:h-32 md:w-32">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarInitials
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-8 pt-20 md:px-10 md:pt-24">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                    {profile.display_name}
                  </h1>
                  <TierBadge tier={profile.tier} />
                </div>
                {niches.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {niches.map((n) => (
                      <span
                        key={n}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : null}
                {profile.city ? (
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    {profile.city}
                  </p>
                ) : null}

              </div>
              <a
                href={`https://wa.me/${profile.whatsapp?.replace(/\D/g, "") ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90"
              >
                Falar com {profile.display_name.split(" ")[0]}
              </a>
            </div>

            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socialAccounts.length > 0
                ? socialAccounts.map((account) => (
                    <SocialCard key={account.id} account={account} />
                  ))
                : metrics.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      network={metric.network}
                      handle={metric.handle ?? null}
                      followers={metric.followers ?? "—"}
                      verified={metric.source === "api" && Boolean(metric.verified_at)}
                      verifiedAt={metric.verified_at ?? null}
                    />
                  ))}
              {socialAccounts.length === 0 && metrics.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  Nenhuma métrica pública disponível.
                </p>
              )}
            </div>


            <div className="mt-10 grid gap-10 md:grid-cols-[1fr_320px]">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Formatos de trabalho</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {formats.length > 0 ? (
                    formats.map((f) => (
                      <span
                        key={f.id}
                        className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
                      >
                        {f.format}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum formato cadastrado.</p>
                  )}
                </div>

                <h2 className="mt-10 text-lg font-extrabold text-foreground">Portfólio</h2>
                {works.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {works.map((work) => (
                      <div
                        key={work.id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
                      >
                        {work.image_url ? (
                          work.link_url ? (
                            <a
                              href={work.link_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="block w-full"
                            >
                              <img
                                src={work.image_url}
                                alt={work.title}
                                loading="lazy"
                                className="aspect-video w-full object-cover"
                              />
                            </a>
                          ) : (
                            <img
                              src={work.image_url}
                              alt={work.title}
                              loading="lazy"
                              className="aspect-video w-full object-cover"
                            />
                          )
                        ) : null}
                        <div className="p-5">
                          <h3 className="font-bold text-foreground">{work.title}</h3>
                          {work.description ? (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {work.description}
                            </p>
                          ) : null}
                          {work.link_url ? (
                            <a
                              href={work.link_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                            >
                              Ver post original
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhum trabalho cadastrado.</p>
                )}

              </div>

              <aside>
                <div className="rounded-[20px] border border-border bg-card p-6">
                  <h2 className="text-base font-extrabold text-foreground">Marcas e parceiros</h2>
                  {brands.length > 0 ? (
                    <ul className="mt-4 space-y-2.5">
                      {brands.map((b) => (
                        <li key={b.id} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">
                            {b.brand_name[0]?.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {b.brand_name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Nenhuma marca cadastrada.</p>
                  )}
                </div>

                <div className="mt-5 rounded-[20px] border border-border bg-card p-6">
                  <h2 className="text-base font-extrabold text-foreground">Contato direto</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Entre em contato diretamente com {profile.display_name.split(" ")[0]} para
                    propostas de parceria.
                  </p>
                  {profile.email && (
                    <p className="mt-4 text-sm font-semibold text-foreground">{profile.email}</p>
                  )}
                  <a
                    href={`https://wa.me/${profile.whatsapp?.replace(/\D/g, "") ?? ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full rounded-full bg-primary py-3 text-center text-sm font-bold text-white transition hover:bg-primary/90"
                  >
                    Enviar mensagem
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  network,
  handle = null,
  followers,
  verified = false,
  verifiedAt = null,
}: {
  network: string;
  handle?: string | null;
  followers: string;
  verified?: boolean;
  verifiedAt?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30">
      <div className="flex items-center gap-2">
        <NetworkBadge network={network} className="h-7 w-7" iconClassName="h-3.5 w-3.5" />
        <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {handle ? `@${handle}` : networkLabel(network)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-extrabold text-foreground">{followers}</span>
        {verified ? (
          <span
            title="Número coletado dos dados públicos da rede social"
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
          >
            Dados públicos
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {verified && verifiedAt
          ? `Atualizado em ${new Date(verifiedAt).toLocaleDateString("pt-BR")}`
          : "Declarado pelo criador"}
      </p>
    </div>
  );
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}

function SocialCard({ account }: { account: PublicSocialAccount }) {
  const snap = account.latest;
  const declared = account.declared_followers?.trim() || null;

  const followers =
    snap?.followers != null && snap.followers > 0
      ? formatNumber(snap.followers)
      : declared || null;
  const isDeclared = !(snap?.followers != null && snap.followers > 0) && Boolean(declared);

  const stats: Array<{ label: string; value: string }> = [];
  if (followers) stats.push({ label: "Seguidores", value: followers });
  if (snap?.posts_count != null && snap.posts_count > 0)
    stats.push({ label: "Publicações", value: formatNumber(snap.posts_count) });
  if (snap?.avg_likes != null && snap.avg_likes > 0)
    stats.push({ label: "Curtidas (méd.)", value: formatNumber(Math.round(snap.avg_likes)) });
  if (snap?.avg_views != null && snap.avg_views > 0)
    stats.push({ label: "Views (méd.)", value: formatNumber(Math.round(snap.avg_views)) });

  if (stats.length === 0 && !account.handle) return null;

  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="relative">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={account.handle ?? networkLabel(account.network)}
              loading="lazy"
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
              {(account.handle ?? networkLabel(account.network))[0]?.toUpperCase()}
            </div>
          )}
          <NetworkBadge
            network={account.network}
            className="absolute -bottom-1 -right-1 h-5 w-5 ring-2 ring-card"
            iconClassName="h-2.5 w-2.5"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {account.handle ? `@${account.handle}` : networkLabel(account.network)}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {networkLabel(account.network)}
          </p>
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-lg font-extrabold leading-tight text-foreground">{stat.value}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isDeclared ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {isDeclared ? "Declarado pelo criador" : "Dados públicos"}
        </span>
        {!isDeclared && account.last_synced_at ? (
          <span className="text-[11px] text-muted-foreground">
            Atualizado em {new Date(account.last_synced_at).toLocaleDateString("pt-BR")}
          </span>
        ) : null}
      </div>
    </>
  );

  // Same visual identity and hover behaviour as the directory cards, with the
  // whole card acting as the link to the social profile.
  const cardClass =
    "flex flex-col rounded-[20px] border border-border bg-card p-5 transition";
  const hoverClass =
    "hover:-translate-y-1 hover:border-[#cfe4d3] hover:shadow-[0_22px_40px_-22px_rgba(13,68,36,0.35)]";

  if (!account.profile_url) {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <a
      href={account.profile_url}
      target="_blank"
      rel="noreferrer noopener"
      className={`group ${cardClass} ${hoverClass}`}
    >
      {content}
    </a>
  );
}
