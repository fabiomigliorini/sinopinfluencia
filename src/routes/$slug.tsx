import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProfileBySlug } from "@/lib/profiles.functions";
import { TierBadge } from "@/components/ProfileCard";
import type { Database } from "@/integrations/supabase/types";

const SITE_URL = "https://sinopinfluencia.lovable.app";

const profileQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["profile", slug],
    queryFn: () => getProfileBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(profileQueryOptions(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Perfil indisponível — Sinop Influencia" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { profile } = loaderData;
    const title = `${profile.display_name} — Criador de conteúdo em ${profile.city ?? "Sinop, MT"}`;
    const description =
      profile.bio ??
      `Perfil de ${profile.display_name}, criador de conteúdo certificado pela ACES em Sinop.`;
    const image = profile.avatar_url
      ? profile.avatar_url.startsWith("http")
        ? profile.avatar_url
        : `${SITE_URL}${profile.avatar_url}`
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/${profile.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.display_name,
            description,
            ...(image ? { image } : {}),
            jobTitle: profile.niche ?? "Criador de conteúdo",
            url: `${SITE_URL}/${profile.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: profile.city ?? "Sinop, MT",
              addressCountry: "BR",
            },
          }),
        },
      ],
    };
  },
  component: ProfilePage,
});


function ProfilePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(profileQueryOptions(slug));
  const { profile, metrics, formats, works, brands } = data;

  const avatarInitials = profile.display_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  const mainMetrics = metrics.slice(0, 3);

  return (
    <div className="bg-background pb-16 pt-8">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <Link
          to="/diretorio"
          search={{}}
          className="inline-flex text-sm font-bold text-primary hover:underline"
        >
          ← Voltar ao diretório
        </Link>

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
              <div className="flex h-28 w-28 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#FFEB00] to-[#D4C200] text-3xl font-extrabold text-[#0D4424] shadow-lg md:h-32 md:w-32">
                {avatarInitials}
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
                <p className="mt-1 text-sm font-semibold text-primary">{profile.niche}</p>
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

            <div className="mt-8 grid gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
              {mainMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  network={metric.network}
                  followers={metric.followers ?? "—"}
                  verified={metric.source === "api" && Boolean(metric.verified_at)}
                  verifiedAt={metric.verified_at ?? null}
                />
              ))}
              {mainMetrics.length === 0 && (
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {works.map((work) => (
                      <div
                        key={work.id}
                        className="rounded-2xl border border-border bg-card p-5"
                      >
                        <h3 className="font-bold text-foreground">{work.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{work.description}</p>
                        {work.image_url && (
                          <img
                            src={work.image_url}
                            alt={work.title}
                            className="mt-3 rounded-xl border border-border"
                          />
                        )}
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
                          <span className="text-sm font-semibold text-foreground">{b.brand_name}</span>
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
  followers,
  verified = false,
  verifiedAt = null,
}: {
  network: string;
  followers: string;
  verified?: boolean;
  verifiedAt?: string | null;
}) {
  const labels: Record<string, { icon: string; color: string }> = {
    instagram: { icon: "📸", color: "#E1306C" },
    tiktok: { icon: "🎵", color: "#000000" },
    youtube: { icon: "▶️", color: "#FF0000" },
    kwai: { icon: "🎬", color: "#FF6600" },
    facebook: { icon: "📘", color: "#1877F2" },
    twitter: { icon: "🐦", color: "#1DA1F2" },
    linkedin: { icon: "💼", color: "#0A66C2" },
  };
  const { icon, color } = labels[network] ?? { icon: "🔗", color: "#0D4424" };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {network}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-extrabold text-foreground">{followers}</span>
        {verified ? (
          <span
            title="Métrica importada diretamente da rede social"
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
          >
            Verificado
          </span>
        ) : null}
      </div>
    </div>
  );
}
