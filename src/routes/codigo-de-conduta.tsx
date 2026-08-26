import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Eye, MessageSquare, Scale, Handshake, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/codigo-de-conduta")({
  component: CodigoDeCondutaPage,
  head: () => ({
    meta: [
      { title: "Código de Conduta, Sinop Influencia" },
      {
        name: "description",
        content:
          "Princípios de ética, transparência e responsabilidade para criadores de conteúdo participantes da vitrine da ACES.",
      },
      { property: "og:title", content: "Código de Conduta, Sinop Influencia" },
      {
        property: "og:description",
        content:
          "Princípios de ética, transparência e responsabilidade para criadores de conteúdo participantes da vitrine da ACES.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sinopinfluencia.lovable.app/codigo-de-conduta" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://sinopinfluencia.lovable.app/codigo-de-conduta" }],
  }),
});

const principles = [
  {
    icon: Eye,
    title: "Transparência",
    description:
      "Sempre deixe claro quando um conteúdo é publicidade, parceria ou indicação comercial. A confiança da audiência é construída com honestidade.",
  },
  {
    icon: Scale,
    title: "Veracidade",
    description:
      "Divulgue informações verdadeiras e verificáveis. Não incentive boatos, fake news ou conteúdo enganoso que possa prejudicar marcas ou consumidores.",
  },
  {
    icon: MessageSquare,
    title: "Respeito",
    description:
      "Trate marcas, parceiros e seguidores com respeito. Discurso de ódio, ataques pessoais ou conteúdo discriminatório não são tolerados.",
  },
  {
    icon: Handshake,
    title: "Compromisso com parceiros",
    description:
      "Cumpra o combinado com as empresas: prazos, entregas, tom de voz e diretrizes da campanha devem ser respeitados como numa relação profissional.",
  },
  {
    icon: ShieldCheck,
    title: "Responsabilidade",
    description:
      "Você é responsável pelo que publica. Pense no impacto do seu conteúdo antes de compartilhar produtos, serviços ou recomendações.",
  },
  {
    icon: AlertCircle,
    title: "Conduta exemplar",
    description:
      "Criadores na vitrine representam a comunidade digital de Sinop. Mantenha uma postura que fortaleça a credibilidade da plataforma e da ACES.",
  },
];

function CodigoDeCondutaPage() {
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
            Código de Conduta
          </h1>
          <p className="lead mt-4 max-w-2xl text-base text-[#CFE8D6] md:text-lg">
            Regras de convivência e princípios que orientam a relação entre criadores, marcas e público dentro da
            Vitrine Sinop Influencia.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-[30px]">Nossos princípios</h2>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              Todos os perfis aprovados na vitrine concordam em seguir estes diretrizes. Elas protegem você, as
              marcas e a audiência.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => (
              <PrincipleCard key={principle.title} {...principle} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F6FBF8] py-14 md:py-20 dark:bg-[#0d2616]">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-[30px]">Dúvidas ou sugestões?</h2>
            <p className="mt-3 text-[15.5px] text-muted-foreground">
              O Código de Conduta pode ser atualizado sempre que necessário. Se tiver alguma dúvida, entre em contato com
              a equipe da ACES.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary"
              >
                Voltar para a home
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90"
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

function PrincipleCard({
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
