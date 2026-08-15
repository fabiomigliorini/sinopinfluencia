import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, TrendingUp, Megaphone, Camera, Heart, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/academia")({
  component: AcademiaPage,
  head: () => ({
    meta: [
      { title: "Academia Sinop Influencia — Capacitação para criadores" },
      {
        name: "description",
        content:
          "Conteúdo, dicas e recursos para criadores de conteúdo de Sinop crescerem com qualidade, ética e resultados.",
      },
      { property: "og:title", content: "Academia Sinop Influencia — Capacitação para criadores" },
      {
        property: "og:description",
        content:
          "Conteúdo, dicas e recursos para criadores de conteúdo de Sinop crescerem com qualidade, ética e resultados.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sinopinfluencia.lovable.app/academia" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://sinopinfluencia.lovable.app/academia" }],
  }),
});

const modules = [
  {
    icon: Camera,
    title: "Crie conteúdo com identidade",
    description:
      "Descubra como transformar o seu dia a dia, talentos e histórias em posts que conectam e engajam o público de Sinop.",
  },
  {
    icon: Heart,
    title: "Construa uma comunidade fiel",
    description:
      "Aprenda a ouvir, responder e criar proximidade com quem te acompanha — o relacionamento é o maior ativo de um criador.",
  },
  {
    icon: BarChart3,
    title: "Entenda as métricas que importam",
    description:
      "Alcance, engajamento, seguidores e conversões: saiba quais indicadores olhar e como usá-los para evoluir.",
  },
  {
    icon: Megaphone,
    title: "Trabalhe com marcas locais",
    description:
      "Saiba como se apresentar para empresas, negociar parcerias e entregar campanhas que geram resultado para ambos os lados.",
  },
  {
    icon: TrendingUp,
    title: "Cresça com consistência",
    description:
      "Planejamento de conteúdo, frequência de postagem e rotina criativa: tudo para manter seu perfil em crescimento.",
  },
  {
    icon: BookOpen,
    title: "Boas práticas e ética",
    description:
      "Transparência, veracidade e respeito com a audiência são a base para uma carreira duradoura no digital.",
  },
];

function AcademiaPage() {
  return (
    <main>
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{
          background: "radial-gradient(circle at 85% -10%, #14622f 0%, #0D4424 55%)",
        }}
      >
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,235,0,0.10),transparent_70%)]" />
        <div className="relative mx-auto max-w-[1180px] px-6 lg:px-7">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#FFEB00]">Para criadores</div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white md:text-[44px]">
            Academia Sinop Influencia
          </h1>
          <p className="lead mt-4 max-w-2xl text-base text-[#CFE8D6] md:text-lg">
            Conteúdo prático para você criar com propósito, crescer com consistência e se conectar com marcas e
            empresas da nossa região.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-[30px]">Módulos de aprendizado</h2>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              Dicas e direcionamentos para criadores de todos os níveis — do primeiro post à parceria profissional.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.title} {...module} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F6FBF8] py-14 md:py-20 dark:bg-[#0d2616]">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-[30px]">Quer fazer parte da vitrine?</h2>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              Cadastre seu perfil, conecte suas redes e fique disponível para marcas e empresas associadas da ACES.
            </p>
            <div className="mt-8">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Cadastrar meu perfil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-7 transition hover:border-primary/20 hover:shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#0D4424] text-[#FFEB00]">
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
