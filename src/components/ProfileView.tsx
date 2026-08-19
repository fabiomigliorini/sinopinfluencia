import { Link } from "@tanstack/react-router";
import { NetworkBadge, networkLabel } from "@/components/network-icons";
import { TierBadge } from "@/components/ProfileCard";
import { whatsappDigits, formatPhoneDisplay } from "@/components/PhoneInput";
import type { Database } from "@/integrations/supabase/types";
import type { PublicSocialAccount } from "@/lib/social-public";

type Tables = Database["public"]["Tables"];

export type ProfileViewData = {
  profile: Tables["profiles"]["Row"];
  formats: Tables["profile_formats"]["Row"][];
  works: Tables["profile_works"]["Row"][];
  brands: Tables["profile_brands"]["Row"][];
  socialAccounts?: PublicSocialAccount[];
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.47.13-.62.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.85 1.21 3.05.15.2 2.06 3.28 5.02 4.47 2.96 1.19 2.96.79 3.5.74.53-.05 1.72-.7 1.96-1.38.25-.68.25-1.26.17-1.38-.07-.12-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.19h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2Zm0 17.98h-.01a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-3.08.81.83-3.01-.19-.31a8.13 8.13 0 0 1-1.25-4.31c0-4.51 3.68-8.18 8.2-8.18 2.19 0 4.24.85 5.79 2.4a8.12 8.12 0 0 1 2.4 5.79c0 4.51-3.68 8.18-8.2 8.18Z" />
    </svg>
  );
}

function compact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return value.toLocaleString("pt-BR");
}

const glassCard =
  "relative overflow-hidden rounded-[26px] border border-white/15 bg-gradient-to-b from-[var(--brand-green-deep)] to-[var(--brand-dark)] shadow-2xl shadow-black/20";

export function ProfileView({
  data,
  backLink,
}: {
  data: ProfileViewData;
  backLink?: React.ReactNode;
}) {
  const { profile, formats, works, brands } = data;
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

  const totalFollowers = socialAccounts.reduce(
    (sum, account) => sum + (Number(account.latest?.followers ?? 0) || 0),
    0,
  );

  const whatsapp = whatsappDigits(profile.whatsapp);
  const whatsappLabel = formatPhoneDisplay(profile.whatsapp);
  const firstName = profile.display_name.split(" ")[0];

  return (
    <div className="bg-background pb-20 pt-8">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        {backLink ?? (
          <Link
            to="/vitrine"
            search={{}}
            className="inline-flex text-sm font-bold text-primary hover:underline"
          >
            ← Voltar à vitrine
          </Link>
        )}

        {/* HERO */}
        <div className={`mt-6 ${glassCard} p-6 md:p-10`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,235,0,0.14),transparent_45%)]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
            <div className="h-56 w-56 shrink-0 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-2xl md:h-72 md:w-72">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-full w-full object-cover object-[center_top]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl font-black text-white/80">
                  {avatarInitials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <TierBadge tier={profile.tier} light />
                {totalFollowers > 0 ? (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                    {compact(totalFollowers)} seguidores
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                {profile.display_name}
              </h1>

              {profile.tagline ? (
                <p className="mt-2 max-w-xl text-[15px] font-medium text-white/75">
                  {profile.tagline}
                </p>
              ) : null}

              {niches.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {niches.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : null}

              {profile.city ? (
                <p className="mt-4 text-sm font-semibold text-white/60">{profile.city}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#0b2b16] shadow-lg shadow-black/25 transition hover:brightness-110"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Falar com {firstName}
                </a>
                {whatsappLabel ? (
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                      WhatsApp
                    </p>
                    <p className="text-sm font-bold text-white">{whatsappLabel}</p>
                  </div>
                ) : null}
                {profile.email ? (
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                      E-mail
                    </p>
                    <p className="text-sm font-bold text-white">{profile.email}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* BIO */}
        {profile.bio ? (
          <section className="mt-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Sobre
            </h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
              {profile.bio}
            </p>
          </section>
        ) : null}

        {/* REDES */}
        <section className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Redes sociais
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {socialAccounts.length > 0 ? (
              socialAccounts.map((account) => (
                <SocialCard
                  key={account.id}
                  account={account}
                  isPrimary={account.network === profile.main_network}
                />
              ))
            ) : (
              <p className="col-span-full text-sm text-muted-foreground">
                Nenhuma métrica pública disponível.
              </p>
            )}
          </div>
        </section>

        {/* PORTFÓLIO */}
        <section className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Portfólio
          </h2>
          {works.length > 0 ? (
            <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum trabalho cadastrado.</p>
          )}
        </section>

        {/* FORMATOS + MARCAS */}
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Formatos de trabalho
            </h2>
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
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Marcas e parceiros
            </h2>
            {brands.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {brands.map((b) => (
                  <span
                    key={b.id}
                    className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    {b.brand_name}
                  </span>
                ))}
              </div>

            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma marca cadastrada.</p>
            )}
          </section>
        </div>

        {/* CTA FINAL */}
        <div className={`mt-14 ${glassCard} p-8 text-center md:p-10`}>
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Quer trabalhar com {firstName}?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">
            Fale diretamente pelo WhatsApp para propostas de parceria e campanhas.
          </p>
          {whatsappLabel ? (
            <p className="mt-4 text-lg font-bold text-white">{whatsappLabel}</p>
          ) : null}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-[#0b2b16] shadow-lg shadow-black/25 transition hover:brightness-110"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Enviar mensagem
          </a>
        </div>
      </div>
    </div>
  );
}

function WorkCard({ work }: { work: Tables["profile_works"]["Row"] }) {
  const inner = (
    <>
      {work.image_url ? (
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={work.image_url}
            alt={work.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)] via-[var(--brand-dark)]/25 to-transparent" />
        </div>
      ) : null}
      <div
        className={
          work.image_url
            ? "absolute inset-x-0 bottom-0 border-t border-white/10 bg-[var(--brand-dark)]/60 px-5 pb-5 pt-4 backdrop-blur-2xl"
            : "px-5 py-6"
        }
      >
        <h3 className="text-base font-extrabold leading-tight text-white">{work.title}</h3>
        {work.description ? (
          <p className="!bio-clamp mt-1.5 text-sm text-white/75">{work.description}</p>
        ) : null}
        {work.link_url ? (
          <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-widest text-[#FFEB00]">
            Ver post original →
          </span>
        ) : null}
      </div>
    </>
  );

  const base = `group ${glassCard} transition-all duration-500`;

  if (!work.link_url) return <div className={base}>{inner}</div>;

  return (
    <a
      href={work.link_url}
      target="_blank"
      rel="noreferrer noopener"
      className={`${base} hover:-translate-y-2 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]`}
    >
      {inner}
    </a>
  );
}

function SocialCard({ account }: { account: PublicSocialAccount }) {
  const snap = account.latest;
  const isDeclared = account.is_declared;

  const stats: Array<{ label: string; value: string }> = [];
  if (snap?.followers != null && snap.followers > 0)
    stats.push({ label: "Seguidores", value: compact(snap.followers) });
  if (snap?.posts_count != null && snap.posts_count > 0)
    stats.push({ label: "Publicações", value: compact(snap.posts_count) });
  if (snap?.avg_likes != null && snap.avg_likes > 0)
    stats.push({ label: "Curtidas (méd.)", value: compact(Math.round(snap.avg_likes)) });
  if (snap?.avg_views != null && snap.avg_views > 0)
    stats.push({ label: "Views (méd.)", value: compact(Math.round(snap.avg_views)) });

  if (stats.length === 0 && !account.handle) return null;

  const content = (
    <div className="relative p-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={account.handle ?? networkLabel(account.network)}
              loading="lazy"
              className="h-12 w-12 rounded-2xl border border-white/20 object-cover"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-sm font-bold text-white">
              {(account.handle ?? networkLabel(account.network))[0]?.toUpperCase()}
            </div>
          )}
          <NetworkBadge
            network={account.network}
            className="absolute -bottom-1 -right-1 h-5 w-5 ring-2 ring-[var(--brand-dark)]"
            iconClassName="h-2.5 w-2.5"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {account.handle ? `@${account.handle}` : networkLabel(account.network)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            {networkLabel(account.network)}
          </p>
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-black leading-none text-white">{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-widest text-white/80">
          {isDeclared ? "Declarado pelo criador" : "Dados públicos"}
        </span>
        {!isDeclared && account.last_synced_at ? (
          <span className="text-[10px] font-semibold text-white/45">
            {new Date(account.last_synced_at).toLocaleDateString("pt-BR")}
          </span>
        ) : null}
      </div>
    </div>
  );

  const base = `group ${glassCard} transition-all duration-500`;

  if (!account.profile_url) return <div className={base}>{content}</div>;

  return (
    <a
      href={account.profile_url}
      target="_blank"
      rel="noreferrer noopener"
      className={`${base} hover:-translate-y-2 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]`}
    >
      {content}
    </a>
  );
}
