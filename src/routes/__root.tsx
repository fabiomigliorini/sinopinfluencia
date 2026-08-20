import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Menu, ChevronDown, X } from "lucide-react";

import appCss from "../styles.css?url";
import brandMark from "@/assets/brand/icone-verde-2-quadrado.png.asset.json";
import logoHorizontal from "@/assets/brand/logo-horizontal-colorido.png.asset.json";

import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { getMyHeaderProfile } from "@/lib/account.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

function useSession() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

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
      { name: "author", content: "Sinop Influencia · ACES" },
      { property: "og:site_name", content: "Sinop Influencia" },
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
      { rel: "icon", href: "/favicon.png", type: "image/png" },
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

function BrandLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#0D4424]">
        <img
          src={brandMark.url}
          alt="Sinop Influencia"
          className="h-[30px] w-[30px] object-contain"
        />
      </div>

      <div className="leading-tight">
        <b className="block text-[17px] font-extrabold tracking-wide text-foreground">
          SINOP <span className="text-primary">INFLUENCIA</span>
        </b>
        <small className="block text-[10.5px] font-semibold tracking-[1.2px] uppercase text-muted-foreground">
          Um programa ACES
        </small>
      </div>
    </Link>
  );
}


function Header() {
  const signedIn = useSession();
  const fetchHeaderProfile = useServerFn(getMyHeaderProfile);
  const { data: headerProfile } = useQuery({
    queryKey: ["my-header-profile"],
    queryFn: () => fetchHeaderProfile(),
    enabled: signedIn === true,
    staleTime: 5 * 60 * 1000,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3.5 lg:px-7">
        <BrandLogo />

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/vitrine" search={{}} className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Encontrar criadores
          </Link>
          <Link to="/" hash="como-funciona" className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Como funciona
          </Link>
          <Link to="/" hash="classificacao" className="text-[14.5px] font-semibold text-foreground/80 transition hover:text-foreground">
            Classificação
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-[14.5px] font-semibold text-foreground/80 outline-none transition hover:text-foreground">
              Sou influenciador
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[14rem]">
              <DropdownMenuItem asChild>
                <Link to={signedIn ? "/dashboard" : "/auth"} className="cursor-pointer">
                  Cadastre seu perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/academia" className="cursor-pointer">
                  Academia Sinop Influencia
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/codigo-de-conduta" className="cursor-pointer">
                  Código de conduta
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="group relative flex items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
              aria-label={headerProfile ? `Minha conta, ${headerProfile.display_name ?? ""}` : "Minha conta"}
              title="Minha conta"
            >
              {headerProfile?.avatar_url ? (
                <img
                  src={headerProfile.avatar_url}
                  alt={headerProfile.display_name ?? ""}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center text-sm font-bold">
                  {initials(headerProfile?.display_name)}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Entrar
            </Link>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-0 bg-[#0D4424] p-0 text-white">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#FFEB00]">Menu</span>
                  <SheetClose asChild>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>
                <div className="flex-1 space-y-1 px-4 py-6">
                  <Link
                    to="/vitrine"
                    search={{}}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    Encontrar criadores
                  </Link>
                  <Link
                    to="/"
                    hash="como-funciona"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    Como funciona
                  </Link>
                  <Link
                    to="/"
                    hash="classificacao"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    Classificação
                  </Link>
                  <div className="pt-4">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FFEB00]">
                      Para criadores
                    </div>
                    <Link
                      to={signedIn ? "/dashboard" : "/auth"}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                    >
                      Cadastre seu perfil
                    </Link>
                    <Link
                      to="/academia"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                    >
                      Academia Sinop Influencia
                    </Link>
                    <Link
                      to="/codigo-de-conduta"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                    >
                      Código de conduta
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function Footer() {
  return (
    <footer className="bg-[#0D4424] text-[#CFE8D6]">
      <div className="mx-auto max-w-[1180px] px-6 pb-6 pt-14 lg:px-7">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-block">
              <img
                src={brandLockup.url}
                alt="Sinop Influencia, um programa ACES"
                className="h-14 w-auto"
              />
            </Link>

            <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-[#A9C9B2]">
              Um programa da ACES, Associação Comercial e Empresarial de Sinop, para qualificar o ambiente digital em favor do comércio local.
            </p>
          </div>
          <div>
            <h5 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white">Para empresas</h5>
            <ul className="space-y-2 text-[13.5px] text-[#B9D8C1]">
              <li><Link to="/vitrine" search={{}} className="transition hover:text-white">Buscar criadores</Link></li>
              <li><Link to="/" hash="como-funciona" className="transition hover:text-white">Como funciona</Link></li>
              <li><Link to="/" hash="classificacao" className="transition hover:text-white">Classificação e critérios</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-3.5 text-xs font-bold uppercase tracking-widest text-white">Para criadores</h5>
            <ul className="space-y-2 text-[13.5px] text-[#B9D8C1]">
              <li><Link to="/auth" className="transition hover:text-white">Cadastre seu perfil</Link></li>
              <li><Link to="/academia" className="transition hover:text-white">Academia Sinop Influencia</Link></li>
              <li><Link to="/codigo-de-conduta" className="transition hover:text-white">Código de conduta</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-[#8FB89A]">
          <span>© Sinop Influencia, um programa ACES.</span>
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
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
