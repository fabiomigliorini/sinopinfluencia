import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NETWORK_META, NETWORK_ORDER, NetworkBadge, type NetworkId } from "@/components/network-icons";
import {
  addNetworkAccount,
  previewNetworkHandle,
  setDeclaredFollowers,
} from "@/lib/social.functions";

type Preview = {
  handle: string;
  metrics: {
    followers: number | null;
    postsCount: number | null;
    likes: number | null;
    views: number | null;
    displayName: string | null;
    avatarUrl: string | null;
    profileUrl: string | null;
  } | null;
  error: string | null;
};

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

export function SocialAccountWizard({
  open,
  onOpenChange,
  onDone,
  youtubeEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  youtubeEnabled: boolean;
}) {
  const runPreview = useServerFn(previewNetworkHandle);
  const runAdd = useServerFn(addNetworkAccount);
  const runDeclare = useServerFn(setDeclaredFollowers);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [network, setNetwork] = useState<NetworkId | null>(null);
  const [handle, setHandle] = useState("");
  const [manual, setManual] = useState({ followers: "", posts: "", likes: "", views: "" });
  const [preview, setPreview] = useState<Preview | null>(null);

  const meta = network ? NETWORK_META[network] : null;

  function reset() {
    setStep(1);
    setNetwork(null);
    setHandle("");
    setManual({ followers: "", posts: "", likes: "", views: "" });
    setPreview(null);
  }

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!network) throw new Error("Escolha uma rede");
      return (await runPreview({ data: { network, handle } })) as Preview;
    },
    onSuccess: (result) => {
      setPreview(result);
      setHandle(result.handle);
      setStep(3);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!network) throw new Error("Escolha uma rede");
      return (await runAdd({
        data: { network, handle, declaredFollowers: manual.trim() || undefined },
      })) as { ok: boolean; error: string | null };
    },
    onSuccess: (result) => {
      if (result.error) toast.warning(`Rede vinculada. ${result.error}`);
      else toast.success("Rede vinculada com sucesso!");
      onDone();
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular rede social</DialogTitle>
          <DialogDescription>
            {step === 1 && "Escolha a rede que você quer vincular ao seu perfil."}
            {step === 2 && `Informe o @ do seu perfil no ${meta?.label}.`}
            {step === 3 && "Confira os dados coletados e confirme."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {NETWORK_ORDER.map((id) => {
              const item = NETWORK_META[id];
              const disabled = id === "youtube" && !youtubeEnabled;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setNetwork(id);
                    setStep(2);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <NetworkBadge network={id} />
                  <span>
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {disabled
                        ? "Aguardando chave da API"
                        : item.auto
                          ? "Dados públicos automáticos"
                          : "Número informado por você"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && meta && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-accent/50 p-3">
              <NetworkBadge network={meta.id} />
              <div>
                <p className="text-sm font-bold">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.hint}</p>
              </div>
            </div>
            <label className="block text-sm font-semibold">
              @ ou link do perfil
              <input
                autoFocus
                className={`${field} mt-2 font-normal`}
                placeholder={meta.placeholder}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && handle.trim()) previewMutation.mutate();
                }}
              />
            </label>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-border px-5 py-2 text-xs font-bold transition hover:bg-accent"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!handle.trim() || previewMutation.isPending}
                onClick={() => previewMutation.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {previewMutation.isPending ? "Consultando..." : "Confirmar @"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && meta && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
              {preview?.metrics?.avatarUrl ? (
                <img
                  src={preview.metrics.avatarUrl}
                  alt={`Foto do perfil no ${meta.label}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <NetworkBadge network={meta.id} className="h-12 w-12" iconClassName="h-5 w-5" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {preview?.metrics?.displayName ?? `@${preview?.handle ?? handle}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meta.label} · @{preview?.handle ?? handle}
                </p>
              </div>
            </div>

            {preview?.metrics ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                  <p className="font-bold">{formatNumber(preview.metrics.followers)}</p>
                </div>
                <div className="rounded-2xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Publicações</p>
                  <p className="font-bold">{formatNumber(preview.metrics.postsCount)}</p>
                </div>
                <div className="rounded-2xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Curtidas</p>
                  <p className="font-bold">{formatNumber(preview.metrics.likes)}</p>
                </div>
                <div className="rounded-2xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Visualizações</p>
                  <p className="font-bold">{formatNumber(preview.metrics.views)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
                  {preview?.error ?? "Não foi possível coletar os dados públicos."}
                </p>
                <label className="block text-sm font-semibold">
                  Informe seus seguidores
                  <input
                    className={`${field} mt-2 font-normal`}
                    placeholder="Ex.: 18,4 mil"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                  />
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    Este número aparecerá como “declarado pelo criador”.
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-border px-5 py-2 text-xs font-bold transition hover:bg-accent"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {addMutation.isPending ? "Salvando..." : "Confirmar e vincular"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
