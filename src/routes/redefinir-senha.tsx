import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha, Sinop Influencia" },
      {
        name: "description",
        content:
          "Crie uma nova senha para acessar sua conta de criador na Vitrine Sinop Influencia.",
      },
      { property: "og:title", content: "Redefinir senha, Sinop Influencia" },
      {
        property: "og:description",
        content: "Crie uma nova senha para acessar sua conta na Vitrine Sinop Influencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const inputClass =
  "rounded-xl border border-border px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success("Senha atualizada com sucesso.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = translateAuthError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_right,#155C30_0%,#0D4424_50%)] py-12 md:py-20">
      <div className="mx-auto w-full max-w-md px-6">
        <Link to="/" className="inline-block text-sm font-bold text-white/80 hover:text-white">
          ← Voltar para home
        </Link>

        <div className="mt-6 overflow-hidden rounded-[24px] bg-white p-7 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.35)] md:p-9">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">Criar nova senha</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma senha nova para acessar sua conta.
            </p>
          </div>

          {ready && !hasSession ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                Link expirado ou inválido. Solicite um novo link de redefinição.
              </div>
              <Link
                to="/auth"
                className="block w-full rounded-full bg-primary py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="new-password">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="new-password-confirm">
                  Confirmar nova senha
                </label>
                <input
                  id="new-password-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !ready}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
