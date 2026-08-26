import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

/** Faixa exibida quando o e-mail da conta ainda não foi confirmado. */
export function EmailVerificationBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      if (user && !user.email_confirmed_at && user.email) setEmail(user.email);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!email) return null;

  const resend = async () => {
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
      toast.success("E-mail de confirmação reenviado.");
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#FFEB00]/60 bg-[#FFEB00]/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-foreground">Confirme seu e-mail</p>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong>{email}</strong>. Você pode continuar usando
          sua conta normalmente.
        </p>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90 disabled:opacity-60"
      >
        {sending ? "Enviando..." : sent ? "E-mail enviado" : "Reenviar e-mail"}
      </button>
    </div>
  );
}
