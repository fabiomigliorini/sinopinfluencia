import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getSocialIntegrationStatus,
  listMyConnections,
  listMyNetworkMetrics,
  removeMyAccount,
  saveNetworkHandle,
  setManualMetric,
  syncMyAccount,
} from "@/lib/social.functions";

type Network = "instagram" | "tiktok" | "youtube" | "facebook";

const NETWORKS: Array<{ id: Network; label: string; placeholder: string; hint: string }> = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "seuperfil",
    hint: "Perfil precisa ser público.",
  },
  { id: "tiktok", label: "TikTok", placeholder: "seuperfil", hint: "Somente perfis públicos." },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "@seucanal ou ID do canal",
    hint: "Inscritos e visualizações via API oficial.",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "suapagina",
    hint: "Funciona com páginas, não com perfis pessoais.",
  },
];

function formatDate(value: string | null) {
  if (!value) return "nunca";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

export function SocialConnections() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getSocialIntegrationStatus);
  const fetchConnections = useServerFn(listMyConnections);
  const saveHandle = useServerFn(saveNetworkHandle);
  const syncAccount = useServerFn(syncMyAccount);
  const removeAccount = useServerFn(removeMyAccount);
  const fetchMetrics = useServerFn(listMyNetworkMetrics);
  const saveManual = useServerFn(setManualMetric);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [manualDrafts, setManualDrafts] = useState<Record<string, string>>({});

  const status = useQuery({
    queryKey: ["social-integration-status"],
    queryFn: () => fetchStatus(),
  });

  const connections = useQuery({
    queryKey: ["my-social-connections"],
    queryFn: () => fetchConnections(),
  });

  const metrics = useQuery({
    queryKey: ["my-network-metrics"],
    queryFn: () => fetchMetrics(),
  });

  useEffect(() => {
    if (!metrics.data) return;
    setManualDrafts((current) => {
      const next = { ...current };
      for (const metric of metrics.data) {
        if (next[metric.network] === undefined && metric.source === "manual") {
          next[metric.network] = metric.followers ?? "";
        }
      }
      return next;
    });
  }, [metrics.data]);

  useEffect(() => {
    if (!connections.data) return;
    setDrafts((current) => {
      const next = { ...current };
      for (const account of connections.data) {
        if (next[account.network] === undefined) next[account.network] = account.handle ?? "";
      }
      return next;
    });
  }, [connections.data]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["my-social-connections"] });
    void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["my-network-metrics"] });
  }

  const saveMutation = useMutation({
    mutationFn: (input: { network: Network; handle: string }) => saveHandle({ data: input }),
    onSuccess: (result) => {
      if (result.removed) toast.success("Rede removida");
      else if (result.error) toast.warning(`Salvo, mas a coleta falhou: ${result.error}`);
      else toast.success("Números públicos atualizados");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const syncMutation = useMutation({
    mutationFn: (accountRowId: string) => syncAccount({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Métricas atualizadas");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (accountRowId: string) => removeAccount({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Rede removida");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const manualMutation = useMutation({
    mutationFn: (input: { network: Network; followers: string }) => saveManual({ data: input }),
    onSuccess: (result) => {
      toast.success(
        result.removed ? "Número manual removido" : "Número manual salvo (marcado como declarado)",
      );
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const accounts = connections.data ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-bold">Métricas públicas das redes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe seu @ em cada rede. Buscamos automaticamente os dados públicos (seguidores,
          publicações, curtidas) na hora e todos os dias. Alcance e dados de audiência não são
          públicos e continuam fora da vitrine.
        </p>
        {status.data && !status.data.youtubeEnabled ? (
          <p className="mt-2 text-xs text-muted-foreground">
            YouTube: a coleta automática será ativada quando a chave da API oficial for configurada.
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {NETWORKS.map((network) => {
          const account = accounts.find((a) => a.network === network.id);
          const value = drafts[network.id] ?? account?.handle ?? "";
          const metric = (metrics.data ?? []).find((m) => m.network === network.id);
          const manualValue =
            manualDrafts[network.id] ??
            (metric?.source === "manual" ? (metric.followers ?? "") : "");
          const busy =
            (saveMutation.isPending && saveMutation.variables?.network === network.id) ||
            (syncMutation.isPending && syncMutation.variables === account?.id);

          return (
            <div key={network.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label className="text-sm font-bold" htmlFor={`net-${network.id}`}>
                    {network.label}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">@</span>
                    <input
                      id={`net-${network.id}`}
                      value={value}
                      placeholder={network.placeholder}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [network.id]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{network.hint}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      saveMutation.mutate({ network: network.id, handle: value.trim() })
                    }
                    className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? "Buscando…" : "Salvar e buscar"}
                  </button>
                  {account ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => syncMutation.mutate(account.id)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-60"
                      >
                        Atualizar agora
                      </button>
                      <button
                        type="button"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(account.id)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      >
                        Remover
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {account ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Seguidores: {formatNumber(account.latest?.followers)} · Publicações:{" "}
                  {formatNumber(account.latest?.posts_count)}
                  {account.latest?.avg_likes != null
                    ? ` · Curtidas: ${formatNumber(account.latest.avg_likes)}`
                    : ""}
                  {account.latest?.avg_views != null
                    ? ` · Visualizações: ${formatNumber(account.latest.avg_views)}`
                    : ""}{" "}
                  · Coletado em {formatDate(account.last_synced_at)}
                </p>
              ) : null}

              {account?.sync_status === "error" && account.sync_error ? (
                <p className="mt-1 text-xs text-destructive">
                  {account.sync_error} — informe o número manualmente abaixo.
                </p>
              ) : null}

              <div className="mt-3 rounded-xl border border-dashed border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="text-xs font-bold"
                    htmlFor={`manual-${network.id}`}
                  >
                    Informar seguidores manualmente
                  </label>
                  {metric?.source === "manual" ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      Declarado pelo criador
                    </span>
                  ) : null}
                  {metric?.source === "api" ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      Dados públicos
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    id={`manual-${network.id}`}
                    value={manualValue}
                    placeholder="Ex.: 12,4 mil ou 12400"
                    onChange={(event) =>
                      setManualDrafts((current) => ({
                        ...current,
                        [network.id]: event.target.value,
                      }))
                    }
                    className="min-w-[160px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={manualMutation.isPending}
                    onClick={() =>
                      manualMutation.mutate({
                        network: network.id,
                        followers: manualValue.trim(),
                      })
                    }
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-60"
                  >
                    {manualMutation.isPending ? "Salvando…" : "Salvar manual"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use quando a coleta automática falhar. O perfil público mostra que o número foi
                  declarado por você. Uma nova coleta bem-sucedida substitui esse valor.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
