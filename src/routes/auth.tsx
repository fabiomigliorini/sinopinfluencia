import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { z } from "zod";
import { translateAuthError } from "@/lib/auth-errors";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, "Informe seu nome"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem",
  });

const recoverSchema = z.object({ email: z.string().email("Informe um e-mail válido") });

type Mode = "login" | "register" | "recover";
type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar, Sinop Influencia" },
      {
        name: "description",
        content:
          "Acesse sua conta na Vitrine Sinop Influencia ou crie seu perfil de criador de conteúdo.",
      },
      { property: "og:title", content: "Entrar ou cadastrar, Sinop Influencia" },
      {
        property: "og:description",
        content:
          "Acesse sua conta na Vitrine Sinop Influencia ou crie seu perfil de criador de conteúdo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass =
  "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setNotice(null);
  };

  const applyZodErrors = (issues: z.ZodIssue[]) => {
    const next: Errors = {};
    for (const issue of issues) {
      const key = issue.path[0] as keyof Errors;
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    const first = issues[0]?.message;
    if (first) toast.error(first);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setNotice(null);

    if (mode === "recover") {
      const parsed = recoverSchema.safeParse({ email });
      if (!parsed.success) return applyZodErrors(parsed.error.issues);
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        setNotice(
          "Enviamos um link de redefinição para o seu e-mail. Confira também a caixa de spam.",
        );
        toast.success("E-mail de redefinição enviado.");
      } catch (err) {
        toast.error(translateAuthError(err));
        setErrors({ email: translateAuthError(err) });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "register") {
      const parsed = registerSchema.safeParse({ name, email, password, confirm });
      if (!parsed.success) return applyZodErrors(parsed.error.issues);
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada! Bem-vindo à Sinop Influencia.");
          navigate({ to: "/dashboard" });
          return;
        }
        setNotice("Cadastro criado! Verifique seu e-mail para confirmar o acesso.");
        toast.success("Cadastro criado. Confirme seu e-mail para entrar.");
      } catch (err) {
        const message = translateAuthError(err);
        toast.error(message);
        setErrors({ email: message });
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return applyZodErrors(parsed.error.issues);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = translateAuthError(err);
      toast.error(message);
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(translateAuthError(result.error));
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } finally {
      setOauthLoading(null);
    }
  };

  const title =
    mode === "login"
      ? "Bem-vindo de volta"
      : mode === "register"
        ? "Crie seu perfil"
        : "Recuperar senha";
  const subtitle =
    mode === "login"
      ? "Entre para gerenciar seu perfil na vitrine."
      : mode === "register"
        ? "Cadastre-se para aparecer na Vitrine Sinop Influencia."
        : "Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.";

  const submitLabel = loading
    ? mode === "login"
      ? "Entrando..."
      : mode === "register"
        ? "Criando conta..."
        : "Enviando..."
    : mode === "login"
      ? "Entrar"
      : mode === "register"
        ? "Criar conta"
        : "Enviar link de redefinição";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_right,#155C30_0%,#0D4424_50%)] py-12 md:py-20">
      <div className="mx-auto w-full max-w-md px-6">
        <Link to="/" className="inline-block text-sm font-bold text-white/80 hover:text-white">
          ← Voltar para home
        </Link>

        <div className="mt-6 overflow-hidden rounded-[24px] bg-white p-7 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.35)] md:p-9">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {mode !== "recover" && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1.5">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`rounded-lg py-2.5 text-sm font-bold transition ${
                    mode === "login" ? "bg-white text-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`rounded-lg py-2.5 text-sm font-bold transition ${
                    mode === "register" ? "bg-white text-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 text-sm font-bold text-foreground transition hover:bg-secondary disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {oauthLoading === "google" ? "Conectando..." : "Continuar com Google"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={oauthLoading !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 text-sm font-bold text-foreground transition hover:bg-secondary disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M16.36 12.72c.02 2.6 2.28 3.47 2.31 3.48-.02.06-.36 1.24-1.2 2.45-.72 1.05-1.47 2.1-2.66 2.12-1.16.02-1.54-.69-2.87-.69-1.33 0-1.74.67-2.85.71-1.14.04-2.01-1.13-2.74-2.18-1.5-2.17-2.64-6.13-1.1-8.81.76-1.33 2.13-2.17 3.61-2.19 1.12-.02 2.17.75 2.86.75.68 0 1.97-.93 3.32-.79.56.02 2.15.2 3.17 1.7-.08.05-1.89 1.11-1.87 3.3M14.2 4.6c.61-.74 1.02-1.76.91-2.78-.87.04-1.94.58-2.57 1.31-.57.65-1.05 1.7-.92 2.7.98.08 1.96-.5 2.58-1.23" />
                  </svg>
                  {oauthLoading === "apple" ? "Conectando..." : "Continuar com Apple"}
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ou
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className={mode === "recover" ? "mt-6 space-y-4" : "space-y-4"}>
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="auth-name">
                  Nome completo
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
                {errors.name && (
                  <span className="text-xs font-semibold text-destructive">{errors.name}</span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="auth-email">
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="seu@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <span className="text-xs font-semibold text-destructive">{errors.email}</span>
              )}
            </div>

            {mode !== "recover" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClass} htmlFor="auth-password">
                    Senha
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("recover")}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                {errors.password && (
                  <span className="text-xs font-semibold text-destructive">{errors.password}</span>
                )}
              </div>
            )}

            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="auth-confirm">
                  Confirmar senha
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
                {errors.confirm && (
                  <span className="text-xs font-semibold text-destructive">{errors.confirm}</span>
                )}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitLabel}
            </button>

            {mode === "recover" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Voltar para o login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
