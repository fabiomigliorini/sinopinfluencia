import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Eye, MessageCircle, UserPlus, Share2, Award, Sparkles } from "lucide-react";
import { metadataQueryOptions, profilesQueryOptions } from "@/lib/profile-queries";
import { buildMetricsMap } from "@/lib/directory-maps";
import { TierBadge } from "@/components/ProfileCard";
import { CreatorCarousel } from "@/components/CreatorCarousel";
import { tierRank, type Tier } from "@/lib/tiers";
import type { Database } from "@/integrations/supabase/types";
import brandLogoAlt from "@/assets/brand/logo-alt-11-quadrado.png.asset.json";


import type { LucideIcon } from "lucide-react";

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
      { title: "Sinop Influencia, Vitrine oficial de criadores de conteúdo" },
      {
        name: "description",
        content:
          "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais.",
      },
      { property: "og:title", content: "Sinop Influencia, Vitrine oficial de criadores de conteúdo" },
      {
        property: "og:description",
        content:
          "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: profiles } = useSuspenseQuery(profilesQueryOptions);

  return (
    <>
      <HeroSearch />
      <HowItWorks />
      <SectionDivider />
      <CreatorOnboarding />
      <TiersLegend />
      <FeaturedDirectory profiles={profiles} />
    </>
  );
}

function HeroSearch() {
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
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#FFEB00]">Vitrine oficial da ACES</div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-[44px]">
              A criatividade de Sinop, <em className="not-italic text-[#FFEB00]">pronta para o seu negócio.</em>
            </h1>
            <p className="lead mt-4 max-w-lg text-base text-[#CFE8D6] md:text-lg">
              Encontre criadores de conteúdo certificados pela ACES, filtrados por especialidade e categoria, e fale
              direto com quem vai divulgar sua marca.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <TrustChip>Perfis com curadoria da ACES</TrustChip>
              <TrustChip>Contato direto, sem intermediação</TrustChip>
              <TrustChip>Métricas verificadas</TrustChip>
            </div>
            <div className="mt-7">
              <Link
                to="/diretorio"
                search={{}}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFEB00] px-7 py-3.5 text-sm font-bold text-[#0D4424] transition hover:brightness-95"
              >
                Ver todos os criadores
              </Link>
            </div>

          </div>

          <div className="hidden justify-center md:flex">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <div className="absolute inset-7 rounded-full border border-dashed border-[#FFEB00]/35" />
              <img
                src={brandLogoAlt.url}
                alt="Logo Sinop Influencia"
                className="relative h-full w-full object-cover"
                loading="lazy"
              />
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
  const steps: { number: number; title: string; description: string; icon: LucideIcon }[] = [
    {
      number: 1,
      title: "Filtre por nicho e categoria",
      description:
        "Busque por especialidade, gastronomia, moda, agro, humor, e pelo nível de maturidade do criador.",
      icon: Search,
    },
    {
      number: 2,
      title: "Veja o perfil completo",
      description: "Métricas, formatos de trabalho, portfólio de campanhas já realizadas e com quem já atuou.",
      icon: Eye,
    },
    {
      number: 3,
      title: "Fale direto com o criador",
      description: "Sem intermediários. O contrato e a negociação são combinados diretamente entre as partes.",
      icon: MessageCircle,
    },
  ];

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
          {steps.map((step) => (
            <StepCard key={step.number} variant="light" {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

type StepCardProps = {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "light" | "brand";
};

function StepCard({ number, title, description, icon: Icon, variant = "light" }: StepCardProps) {
  const isBrand = variant === "brand";
  return (
    <div
      className={`rounded-[20px] border p-7 transition ${
        isBrand
          ? "border-white/10 bg-white/[0.06] text-white backdrop-blur-sm hover:border-[#FFEB00]/30 hover:bg-white/[0.09]"
          : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
      }`}
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] ${
          isBrand ? "bg-[#FFEB00] text-[#0D4424]" : "bg-[#0D4424] text-[#FFEB00]"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className={`text-xs font-extrabold ${isBrand ? "text-[#FFEB00]/80" : "text-muted-foreground"}`}>
        Passo {number}
      </div>
      <h3 className={`mt-1 text-lg font-bold ${isBrand ? "text-white" : "text-foreground"}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${isBrand ? "text-[#CFE8D6]" : "text-muted-foreground"}`}>
        {description}
      </p>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="relative h-24 overflow-hidden bg-[#0D4424]">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-[#FFEB00] blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-[#FFEB00] blur-3xl" />
      </div>
      <div className="relative flex h-full items-center justify-center gap-3">
        <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#FFEB00]/60" />
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#FFEB00]/30 bg-[#FFEB00]/10">
          <Sparkles className="h-5 w-5 text-[#FFEB00]" />
        </div>
        <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#FFEB00]/60" />
      </div>
    </div>
  );
}

function CreatorOnboarding() {
  const steps: { number: number; title: string; description: string; icon: LucideIcon }[] = [
    {
      number: 1,
      title: "Cadastre seu perfil",
      description: "Crie sua conta, preencha suas informações básicas e escreva uma bio que mostre quem você é.",
      icon: UserPlus,
    },
    {
      number: 2,
      title: "Conecte suas redes",
      description: "Vincule Instagram, TikTok, YouTube e outras redes. Suas métricas são atualizadas automaticamente.",
      icon: Share2,
    },
    {
      number: 3,
      title: "Seja descoberto por marcas",
      description: "Após aprovação da curadoria da ACES, seu perfil entra na vitrine e fica disponível para parcerias.",
      icon: Award,
    },
  ];

  return (
    <section
      id="para-criadores"
      className="relative overflow-hidden py-16 md:py-20"
      style={{
        background: "radial-gradient(circle at 15% 50%, #14622f 0%, #0D4424 60%)",
      }}
    >
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FFEB00]/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#FFEB00]/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#FFEB00]">
            Para influenciadores e criadores de conteúdo
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-[30px]">
            Três passos para fazer parte da vitrine
          </h2>
          <p className="mt-3 text-[15.5px] text-[#CFE8D6]">
            Entre para o diretório oficial de criadores de Sinop e seja encontrado por marcas e empresas associadas.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} variant="brand" {...step} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFEB00] px-7 py-3.5 text-sm font-bold text-[#0D4424] transition hover:brightness-95"
          >
            Quero fazer parte
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedDirectory({ profiles }: { profiles: ProfileRow[] }) {
  const { data: metadata } = useSuspenseQuery(metadataQueryOptions);
  const metricsMap = buildMetricsMap(metadata?.metrics ?? []);

  return (
    <section id="diretorio" className="pb-20 pt-4">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="max-w-xl text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-primary">Diretório</div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-[30px]">Criadores certificados</h2>
        </div>

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
  const tiers: { tier: Tier; label: string; description: string }[] = [
    {
      tier: "creator",
      label: "Criador",
      description:
        "Perfil aprovado pela curadoria da ACES. Criador ativo com presença digital verificada e potencial para parcerias locais.",
    },
    {
      tier: "reference",
      label: "Referência",
      description:
        "Criador reconhecido como referência em seu nicho. Produção consistente, público fiel e histórico de colaborações comerciais.",
    },
    {
      tier: "icon",
      label: "Ícone",
      description:
        "Criador de grande relevância e influência consolidada. Alto alcance, engajamento forte e presença de destaque na comunidade.",
    },
    {
      tier: "featured",
      label: "Destaque",
      description:
        "Criador de excelência com impacto comprovado. Alcance significativo, múltiplas parcerias de peso e representatividade especial para marcas.",
    },
  ];

  return (
    <section id="classificacao" className="bg-[#0D4424] py-14 md:py-20">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#FFEB00]">Níveis de certificação</div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-[30px]">
            Classificação com critérios da ACES
          </h2>
          <p className="mt-3 text-[15.5px] text-[#CFE8D6]">
            Cada perfil é avaliado pela nossa curadoria com base em alcance, engajamento, histórico de parcerias e
            relevância no nicho. As estrelas indicam o nível de maturidade do criador.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map(({ tier, label, description }) => (
            <div
              key={tier}
              className="rounded-[22px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition hover:border-[#FFEB00]/30 hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between gap-3">
                <TierBadge tier={tier} light />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFEB00]">
                  {tierRank(tier)} {tierRank(tier) === 1 ? "estrela" : "estrelas"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#CFE8D6]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
