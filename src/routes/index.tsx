import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { metadataQueryOptions, profilesQueryOptions } from "@/lib/profile-queries";
import { buildFormatsMap, buildMetricsMap } from "@/lib/directory-maps";
import { ProfileCard, TierBadge } from "@/components/ProfileCard";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(profilesQueryOptions),
      context.queryClient.ensureQueryData(metadataQueryOptions),
    ]);
  },

  head: () => ({
    meta: [
      { title: "Sinop Influencia — Vitrine oficial de criadores de conteúdo" },
      { name: "description", content: "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais." },
      { property: "og:title", content: "Sinop Influencia — Vitrine oficial de criadores de conteúdo" },
      { property: "og:description", content: "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: profiles } = useSuspenseQuery(profilesQueryOptions);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [network, setNetwork] = useState("");

  const featured = profiles.slice(0, 6);

  const niches = Array.from(
    new Set(
      profiles.flatMap((p) =>
        (p.niche ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const networks = [
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "YouTube" },
    { value: "kwai", label: "Kwai" },
    { value: "linkedin", label: "LinkedIn" },
  ];

  return (
    <>
      <HeroSearch
        query={query}
        onQueryChange={setQuery}
        niche={niche}
        onNicheChange={setNiche}
        network={network}
        onNetworkChange={setNetwork}
        niches={niches}
        networks={networks}
      />
      <HowItWorks />
      <FeaturedDirectory
        profiles={featured}
        query={query}
        niche={niche}
        network={network}
      />
    </>
  );
}

function HeroSearch({
  query,
  onQueryChange,
  niche,
  onNicheChange,
  network,
  onNetworkChange,
  niches,
  networks,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  niche: string;
  onNicheChange: (v: string) => void;
  network: string;
  onNetworkChange: (v: string) => void;
  niches: (string | null)[];
  networks: { value: string; label: string }[];
}) {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-20"
      style={{
        background: "radial-gradient(circle at 85% -10%, #14622f 0%, #0D4424 55%)",
      }}
    >
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,235,0,0.10),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#FFEB00]">
              Vitrine oficial da ACES
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-[44px]">
              A criatividade de Sinop,{" "}
              <em className="not-italic text-[#FFEB00]">pronta para o seu negócio.</em>
            </h1>
            <p className="lead mt-4 max-w-lg text-base text-[#CFE8D6] md:text-lg">
              Encontre criadores de conteúdo certificados pela ACES, filtrados por especialidade e categoria — e fale direto com quem vai divulgar sua marca.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <TrustChip>Perfis com curadoria da ACES</TrustChip>
              <TrustChip>Contato direto, sem intermediação</TrustChip>
              <TrustChip>Métricas verificadas</TrustChip>
            </div>

            <div className="mt-9 rounded-[22px] bg-white p-5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.35)]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
                <div className="flex flex-col gap-1.5">
                  <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    O que você procura
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Ex.: gastronomia, moda, agro…"
                    className="rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={niche}
                    onChange={(e) => onNicheChange(e.target.value)}
                    className="rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">Todas as categorias</option>
                    {niches.map((n) => (
                      <option key={n} value={n ?? ""}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Rede principal
                  </label>
                  <select
                    value={network}
                    onChange={(e) => onNetworkChange(e.target.value)}
                    className="rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">Todas as redes</option>
                    {networks.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Link
                  to="/diretorio"
                  search={{ q: query, niche, network, tier: "" }}
                  className="flex items-center justify-center gap-2 self-end rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  Buscar
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden justify-center md:flex">
            <div className="flex h-72 w-72 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <div className="absolute inset-7 rounded-full border border-dashed border-[#FFEB00]/35" />
              <svg width="150" height="175" viewBox="0 0 240 280" aria-hidden="true">
                <path d="M 92 190 L 120 252 L 148 190 Z" fill="#fff" opacity="0.95" />
                <rect x="28" y="16" width="184" height="184" rx="58" fill="#fff" opacity="0.95" />
                <g transform="translate(120,108) rotate(45)">
                  <rect x="-38" y="-38" width="76" height="76" rx="24" fill="#FFEB00" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-[13px] font-semibold text-[#E7F4EA]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#FFEB00]" />
      {children}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-primary">Para empresas associadas</div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-[30px]">
            Três passos até a parceria certa
          </h2>
          <p className="mt-3 text-[15.5px] text-muted-foreground">
            A Vitrine existe para aproximar o comércio local de quem já fala com o público de Sinop.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <StepCard
            number={1}
            title="Filtre por nicho e categoria"
            description="Busque por especialidade — gastronomia, moda, agro, humor — e pelo nível de maturidade do criador."
          />
          <StepCard
            number={2}
            title="Veja o perfil completo"
            description="Métricas, formatos de trabalho, portfólio de campanhas já realizadas e com quem já atuou."
          />
          <StepCard
            number={3}
            title="Fale direto com o criador"
            description="Sem intermediários. O contrato e a negociação são combinados diretamente entre as partes."
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-7">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#0D4424] text-sm font-extrabold text-[#FFEB00]">
        {number}
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function FeaturedDirectory({ profiles }: { profiles: ProfileRow[] }) {
  const { data: metadata } = useSuspenseQuery(metadataQueryOptions);
  const metricsMap = buildMetricsMap(metadata?.metrics ?? []);

  return (
    <section id="diretorio" className="pb-20 pt-4">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-primary">Diretório</div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-[30px]">Criadores certificados</h2>
        </div>

        <TiersLegend />
      </div>

      <div className="mt-8">
        <CreatorCarousel profiles={profiles} metricsMap={metricsMap} />
      </div>

      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">


        <div className="mt-10 text-center">
          <Link
            to="/diretorio"
            search={{}}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
          >
            Ver todos os criadores
          </Link>
        </div>
      </div>
    </section>
  );
}

function TiersLegend() {
  const tiers = [
    { tier: "creator", label: "Criador" },
    { tier: "reference", label: "Referência" },
    { tier: "icon", label: "Ícone" },
    { tier: "featured", label: "Destaque" },
  ];
  return (
    <div className="mt-8 flex flex-wrap gap-4 rounded-2xl bg-[#155C30] p-4 md:gap-6 md:p-4">
      {tiers.map(({ tier, label }) => (
        <div key={tier} className="flex items-center gap-2.5 text-xs font-semibold text-white">
          <TierBadge tier={tier} />
          {label}
        </div>
      ))}
    </div>
  );
}
