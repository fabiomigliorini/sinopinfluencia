import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar atualizar ou voltar para a home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sinop Influencia — Vitrine oficial de criadores de conteúdo" },
      { name: "description", content: "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais." },
      { name: "author", content: "Sinop Influencia · ACES" },
      { property: "og:title", content: "Sinop Influencia — Vitrine oficial de criadores de conteúdo" },
      { property: "og:description", content: "Encontre criadores de conteúdo certificados pela ACES em Sinop. Perfis verificados, métricas e contato direto com influenciadores locais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@SinopInfluencia" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <svg className="sym" width="34" height="40" viewBox="0 0 240 280" aria-hidden="true">
        <path d="M 92 190 L 120 252 L 148 190 Z" fill={light ? "#fff" : "#27A03E"} />
        <rect x="28" y="16" width="184" height="184" rx="58" fill={light ? "#fff" : "#27A03E"} />
        <g transform="translate(120,108) rotate(45)">
          <rect x="-38" y="-38" width="76" height="76" rx="24" fill="#FFEB00" />
        </g>
      </svg>
      <div className="leading-tight">
        <b className="block text-[17px] font-extrabold tracking-wide text-foreground">
          SINOP <span className="text-primary">INFLUENCIA</span>
        </b>
        <small className="block text-[10.5px] font-semibold tracking-[1.2px] uppercase text-muted-foreground">
          Vitrine oficial · ACES
        </small>
      </div>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3.5 lg:px-7">
        <BrandLogo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/diretorio" search={{}} className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Encontrar criadores
          </Link>
          <Link to="/" hash="como-funciona" className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Como funciona
          </Link>
          <Link to="/" hash="diretorio" className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Categorias
          </Link>
          <Link to="/auth" className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Sou influenciador
          </Link>
        </nav>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Cadastrar meu perfil
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0D4424] text-[#CFE8D6]">
      <div className="mx-auto max-w-[1180px] px-6 pb-6 pt-14 lg:px-7">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <svg className="sym" width="30" height="35" viewBox="0 0 240 280" aria-hidden="true">
                <path d="M 92 190 L 120 252 L 148 190 Z" fill="#fff" />
                <rect x="28" y="16" width="184" height="184" rx="58" fill="#fff" />
                <g transform="translate(120,108) rotate(45)">
                  <rect x="-38" y="-38" width="76" height="76" rx="24" fill="#FFEB00" />
                </g>
              </svg>
              <div className="leading-tight">
                <b className="block text-[17px] font-extrabold tracking-wide text-white">
                  SINOP <span className="text-[#FFEB00]">INFLUENCIA</span>
                </b>
              </div>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-[#A9C9B2]">
              Um programa da ACES — Associação Comercial e Empresarial de Sinop — para qualificar o ambiente digital em favor do comércio local.
            </p>
          </div>
          <div>
            <h5 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white">Para empresas</h5>
            <ul className="space-y-2 text-[13.5px] text-[#B9D8C1]">
              <li><Link to="/diretorio" search={{}} className="transition hover:text-white">Buscar criadores</Link></li>
              <li><Link to="/" hash="como-funciona" className="transition hover:text-white">Como funciona</Link></li>
              <li><Link to="/" hash="diretorio" className="transition hover:text-white">Categorias e critérios</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white">Para criadores</h5>
            <ul className="space-y-2 text-[13.5px] text-[#B9D8C1]">
              <li><Link to="/auth" className="transition hover:text-white">Cadastre seu perfil</Link></li>
              <li><span className="transition hover:text-white cursor-pointer">Academia Sinop Influencia</span></li>
              <li><span className="transition hover:text-white cursor-pointer">Código de conduta</span></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-[#8FB89A]">
          <span>© Sinop Influencia — um programa ACES.</span>
          <span>Vitrine oficial de criadores de conteúdo de Sinop.</span>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
