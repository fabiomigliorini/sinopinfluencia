import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

const PROJECT_NAME = "Sinop Influencia (programa ACES)";
const CNPJ_PLACEHOLDER = "[CNPJ]";
const CONTACT_EMAIL = "[e-mail de contato]";

export function ConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Autorização de uso de dados e imagem</DialogTitle>
          <DialogDescription>
            Leia com atenção antes de publicar seu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>
            Ao enviar meu cadastro, autorizo a <strong>{PROJECT_NAME}</strong>, CNPJ{" "}
            <strong>{CNPJ_PLACEHOLDER}</strong>, a tratar os dados que forneci — nome,
            foto, biografia, especialidades, portfólio, links e métricas públicas das
            minhas redes sociais — com a finalidade de compor um catálogo de
            influenciadores destinado à consulta por empresas interessadas em contratar
            serviços de divulgação.
          </p>

          <p>Declaro estar ciente de que:</p>

          <ul className="list-disc space-y-2 pl-5">
            <li>
              meu perfil passará por curadoria e só ficará visível após aprovação,
              podendo ser recusado ou suspenso a qualquer momento;
            </li>
            <li>
              uma vez aprovado, meus dados ficarão acessíveis aos usuários empresariais
              da plataforma, que poderão entrar em contato comigo pelos canais que
              informei;
            </li>
            <li>
              as métricas das minhas redes sociais poderão ser coletadas periodicamente
              a partir de fontes públicas e exibidas no meu perfil;
            </li>
            <li>
              a plataforma apenas apresenta perfis e não participa de negociações,
              contratos ou pagamentos entre mim e as empresas;
            </li>
            <li>
              posso solicitar a correção, a suspensão ou a exclusão definitiva do meu
              cadastro a qualquer momento, sem custo, pelo e-mail{" "}
              <strong>{CONTACT_EMAIL}</strong>, nos termos da Lei nº 13.709/2018 (LGPD).
            </li>
          </ul>

          <p>
            Confirmo que os dados informados são verdadeiros e que possuo os direitos
            sobre as imagens e conteúdos enviados no meu portfólio.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4 transition hover:bg-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
          />
          <span className="text-sm font-medium leading-snug text-foreground">
            Li e concordo com o tratamento dos meus dados conforme descrito acima.
          </span>
        </label>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold transition hover:bg-accent"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              setAgreed(false);
            }}
            disabled={!agreed || isPending}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Publicando..." : "Confirmar e publicar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
