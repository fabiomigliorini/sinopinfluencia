import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { NetworkBadge, networkLabel } from "@/components/network-icons";
import { TierBadge } from "@/components/ProfileCard";
import { whatsappDigits, formatPhoneDisplay } from "@/components/PhoneInput";
import type { Database } from "@/integrations/supabase/types";
import type { PublicSocialAccount } from "@/lib/social-public";

type Tables = Database["public"]["Tables"];
type Work = Tables["profile_works"]["Row"];

export type ProfileViewData = {
  profile: Tables["profiles"]["Row"];
  formats: Tables["profile_formats"]["Row"][];
  works: Work[];
  brands: Tables["profile_brands"]["Row"][];
  socialAccounts?: PublicSocialAccount[];
};

/** Slots de edição: quando presentes, o ProfileView renderiza os controles do painel do criador. */
export type ProfileViewEdit = {
  /** Badges extras no hero (status, slug). */
  extraBadges?: React.ReactNode;
  /** Ações no lugar do botão de WhatsApp (trocar foto, editar infos, ver perfil público). */
  heroActions?: React.ReactNode;
  /** Nota abaixo das ações do hero (dica de status). */
  heroNote?: React.ReactNode;
  /** Botões ao lado do título de cada seção. */
  sectionActions?: Partial<
    Record<"sobre" | "redes" | "portfolio" | "formatos" | "marcas", React.ReactNode>
  >;
  /** Botão de adicionar nicho, renderizado após os chips do hero. */
  addNicheButton?: React.ReactNode;
  onRemoveNiche?: (name: string) => void;
  onRemoveBrand?: (id: string) => void;
  /** Ações por card de trabalho (editar/remover). */
  workActions?: (work: Work) => React.ReactNode;
  /** Ações por card de rede social (atualizar/informar/remover). */
  socialActions?: (account: PublicSocialAccount) => React.ReactNode;
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

const sectionTitle =
  "text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground";

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  if (!action) return <h2 className={sectionTitle}>{title}</h2>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className={sectionTitle}>{title}</h2>
      {action}
    </div>
  );
}

export function ProfileView({
  data,
  backLink,
  edit,
}: {
  data: ProfileViewData;
  backLink?: React.ReactNode;
  edit?: ProfileViewEdit;
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
    <div className={edit ? "" : "bg-background pb-20 pt-8"}>
      <div className={edit ? "" : "mx-auto max-w-[1180px] px-6 lg:px-7"}>
        {edit ? (
          backLink
        ) : (
          backLink ?? (
            <Link
              to="/vitrine"
              search={{}}
              className="inline-flex text-sm font-bold text-primary hover:underline"
            >
              ← Voltar à vitrine
            </Link>
          )
        )}

        {/* HERO */}
        <div className={`${edit ? "" : "mt-6 "}${glassCard} p-0`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,235,0,0.14),transparent_45%)]" />
          <div className="relative flex flex-col md:flex-row">
            <div className="relative aspect-[3/4] w-full overflow-hidden md:aspect-[2/3] md:w-[280px] md:shrink-0 lg:w-[300px]">
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

            <div className="min-w-0 flex-1 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                {edit?.extraBadges}
                <TierBadge tier={profile.tier} light showLabel variant="pill" />
                {totalFollowers > 0 ? (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                    {compact(totalFollowers)} seguidores
                  </span>
                ) : null}
                {profile.main_network ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEB00] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a]">
                    <NetworkBadge
                      network={profile.main_network}
                      className="h-4 w-4"
                      iconClassName="h-2 w-2"
                    />
                    Rede principal: {networkLabel(profile.main_network)}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                {profile.display_name}
              </h1>

              {profile.tagline ? (
                <p className="mt-2 max-w-xl text-[15px] font-medium text-white/75">
                  {profile.tagline}
                </p>
              ) : null}

              {niches.length > 0 || edit?.addNicheButton ? (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {niches.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    >
                      {n}
                      {edit?.onRemoveNiche ? (
                        <button
                          type="button"
                          aria-label={`Remover ${n}`}
                          onClick={() => edit.onRemoveNiche!(n)}
                          className="rounded-full p-0.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                  {edit?.addNicheButton}
                </div>
              ) : null}

              {profile.city ? (
                <p className="mt-4 text-sm font-semibold text-white/60">{profile.city}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {edit?.heroActions ?? (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#0b2b16] shadow-lg shadow-black/25 transition hover:brightness-110"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Falar com {firstName}
                  </a>
                )}
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

              {edit?.heroNote ? <div className="mt-5">{edit.heroNote}</div> : null}
            </div>
          </div>
        </div>

        {/* BIO */}
        {profile.bio || edit ? (
          <section className="mt-10">
            <SectionHeading title="Sobre" action={edit?.sectionActions?.sobre} />
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
              {profile.bio ?? "Você ainda não escreveu sua bio."}
            </p>
          </section>
        ) : null}

        {/* REDES */}
        <section className="mt-12">
          <SectionHeading title="Redes sociais" action={edit?.sectionActions?.redes} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {socialAccounts.length > 0 ? (
              socialAccounts.map((account) => (
                <SocialCard
                  key={account.id}
                  account={account}
                  isPrimary={account.network === profile.main_network}
                  actions={edit?.socialActions?.(account)}
                />
              ))
            ) : (
              <p className="col-span-full text-sm text-muted-foreground">
                {edit
                  ? "Nenhuma rede vinculada ainda. Clique em “Vincular nova rede”."
                  : "Nenhuma métrica pública disponível."}
              </p>
            )}
          </div>
        </section>

        {/* PORTFÓLIO */}
        <section className="mt-12">
          <SectionHeading title="Portfólio" action={edit?.sectionActions?.portfolio} />
          {works.length > 0 ? (
            <div className="mt-4 grid items-start gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {works.map((work) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  actions={edit?.workActions?.(work)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum trabalho cadastrado.</p>
          )}
        </section>

        {/* FORMATOS + MARCAS */}
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <section>
            <SectionHeading
              title="Formatos de trabalho"
              action={edit?.sectionActions?.formatos}
            />
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
            <SectionHeading
              title="Marcas e parceiros"
              action={edit?.sectionActions?.marcas}
            />
            {brands.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {brands.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    {b.brand_name}
                    {edit?.onRemoveBrand ? (
                      <button
                        type="button"
                        aria-label={`Remover ${b.brand_name}`}
                        onClick={() => edit.onRemoveBrand!(b.id)}
                        className="rounded-full p-0.5 text-muted-foreground transition hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma marca cadastrada.</p>
            )}
          </section>
        </div>

        {/* CTA FINAL */}
        {!edit && (
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
        )}
      </div>
    </div>
  );
}

function WorkCard({
  work,
  actions,
}: {
  work: Work;
  actions?: React.ReactNode;
}) {
  const inner = (
    <>
      {work.image_url ? (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={work.image_url}
            alt={work.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

        </div>
      ) : null}
      <div className="border-t border-white/10 px-5 pb-5 pt-4">
        <h3 className="text-base font-extrabold leading-tight text-white">{work.title}</h3>
        {work.description ? (
          <p className="!bio-clamp mt-1.5 text-sm text-white/75">{work.description}</p>
        ) : null}
        {work.link_url ? (
          <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-widest text-[#FFEB00]">
            Ver post original →
          </span>
        ) : null}
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </>
  );

  const base = `group relative z-0 ${glassCard} transition-all duration-500`;

  if (!work.link_url || actions) {
    return <div className={actions ? `${base} hover:z-10 hover:scale-105 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]` : base}>{inner}</div>;
  }

  return (
    <a
      href={work.link_url}
      target="_blank"
      rel="noreferrer noopener"
      className={`${base} hover:z-10 hover:scale-105 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)]`}
    >
      {inner}
    </a>
  );
}

function SocialCard({
  account,
  isPrimary = false,
  actions,
}: {
  account: PublicSocialAccount;
  isPrimary?: boolean;
  actions?: React.ReactNode;
}) {
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
    <>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {account.avatar_url ? (
            <img
              src={account.avatar_url}
              alt={account.handle ?? networkLabel(account.network)}
              loading="lazy"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white ring-2 ring-white/20">
              {(account.handle ?? networkLabel(account.network))[0]?.toUpperCase()}
            </div>
          )}
          <NetworkBadge
            network={account.network}
            className="absolute -bottom-1 -right-1 h-6 w-6 ring-2 ring-[var(--brand-dark)]"
            iconClassName="h-3 w-3"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">
            {account.handle ? `@${account.handle}` : networkLabel(account.network)}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {networkLabel(account.network)}
          </p>
          {account.profile_url && !actions ? (
            <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-widest text-[#FFEB00]">
              Ver perfil →
            </span>
          ) : null}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 px-3 py-2.5">
              <p className="text-lg font-extrabold leading-tight text-white">{stat.value}</p>
              <p className="text-[11px] font-semibold text-white/55">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isDeclared ? "bg-white/10 text-white/60" : "bg-[#FFEB00]/15 text-[#FFEB00]"
          }`}
        >
          {isDeclared ? "Declarado pelo criador" : "Dados públicos"}
        </span>
        {!isDeclared && account.last_synced_at ? (
          <span className="text-[11px] text-white/50">
            Atualizado em {new Date(account.last_synced_at).toLocaleDateString("pt-BR")}
          </span>
        ) : null}
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </>
  );

  const cardClass = `group relative z-0 flex flex-col ${glassCard} p-6 transition-all duration-500`;
  const hoverClass =
    "hover:z-10 hover:scale-105 hover:shadow-[0_32px_64px_-24px_rgba(0,0,0,0.45)]";

  if (!account.profile_url || actions) {
    return <div className={`${cardClass} ${actions ? hoverClass : ""}`}>{content}</div>;
  }

  return (
    <a
      href={account.profile_url}
      target="_blank"
      rel="noreferrer noopener"
      className={`${cardClass} ${hoverClass}`}
    >
      {content}
    </a>
  );
}
