import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  createConnectSession,
  disconnectMyAccount,
  getSocialIntegrationStatus,
  listMyConnections,
  registerConnectedAccount,
  syncMyAccount,
} from "@/lib/social.functions";

const SDK_URL = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";

const NETWORK_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

type ConnectSdk = {
  initialize: (config: Record<string, unknown>) => {
    open: () => void;
    exit: () => void;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
  };
};

async function loadSdk(): Promise<ConnectSdk> {
  const existing = (window as unknown as { PhylloConnect?: ConnectSdk }).PhylloConnect;
  if (existing) return existing;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o conector"));
    document.head.appendChild(script);
  });
  const sdk = (window as unknown as { PhylloConnect?: ConnectSdk }).PhylloConnect;
  if (!sdk) throw new Error("Conector indisponível");
  return sdk;
}

function formatDate(value: string | null) {
  if (!value) return "nunca";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

export function SocialConnections() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getSocialIntegrationStatus);
  const fetchConnections = useServerFn(listMyConnections);
  const startSession = useServerFn(createConnectSession);
  const registerAccount = useServerFn(registerConnectedAccount);
  const syncAccount = useServerFn(syncMyAccount);
  const disconnect = useServerFn(disconnectMyAccount);
  const [connecting, setConnecting] = useState(false);

  const status = useQuery({
    queryKey: ["social-integration-status"],
    queryFn: () => fetchStatus(),
  });

  const connections = useQuery({
    queryKey: ["my-social-connections"],
    queryFn: () => fetchConnections(),
    enabled: status.data?.enabled === true,
  });

  const syncMutation = useMutation({
    mutationFn: (accountRowId: string) => syncAccount({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Métricas atualizadas");
      void queryClient.invalidateQueries({ queryKey: ["my-social-connections"] });
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountRowId: string) => disconnect({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Conta desconectada");
      void queryClient.invalidateQueries({ queryKey: ["my-social-connections"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleConnect(network?: string) {
    setConnecting(true);
    try {
      const session = await startSession({
        data: network ? { network: network as "instagram" } : {},
      });
      const sdk = await loadSdk();
      const instance = sdk.initialize({
        clientDisplayName: "Sinop Influencia",
        environment: session.environment,
        userId: session.providerUserId,
        token: session.token,
        ...(session.workPlatformId ? { workPlatformId: session.workPlatformId } : {}),
      });

      instance.on("accountConnected", (accountId) => {
        void (async () => {
          try {
            await registerAccount({
              data: {
                accountId: String(accountId),
                providerUserId: session.providerUserId,
              },
            });
            toast.success("Conta conectada! As métricas serão importadas em instantes.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao salvar a conexão");
          } finally {
            void queryClient.invalidateQueries({ queryKey: ["my-social-connections"] });
            void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
          }
        })();
      });
      instance.on("accountDisconnected", () => {
        void queryClient.invalidateQueries({ queryKey: ["my-social-connections"] });
      });
      instance.on("tokenExpired", () => toast.error("Sessão expirada, tente novamente."));
      instance.on("exit", () => setConnecting(false));
      instance.on("connectionFailure", (reason) =>
        toast.error(`Não foi possível conectar: ${String(reason ?? "erro desconhecido")}`),
      );

      instance.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao abrir o conector");
    } finally {
      setConnecting(false);
    }
  }

  if (status.isLoading) return null;

  if (!status.data?.enabled) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-card p-6">
        <h2 className="text-lg font-bold">Métricas automáticas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A importação automática de seguidores e engajamento ainda não está ativa. Enquanto isso,
          informe seus números manualmente no bloco de métricas.
        </p>
      </section>
    );
  }

  const items = connections.data ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Métricas automáticas</h2>
          <p className="text-sm text-muted-foreground">
            Conecte suas redes para importar seguidores e engajamento verificados. A atualização é
            diária e você também pode atualizar quando quiser.
          </p>
        </div>
        <button
          type="button"
          disabled={connecting}
          onClick={() => void handleConnect()}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {connecting ? "Abrindo…" : "Conectar rede social"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma rede conectada ainda. Redes disponíveis:{" "}
            {(status.data.networks ?? []).map((n) => NETWORK_LABEL[n] ?? n).join(", ")}.
          </p>
        )}

        {items.map((account) => (
          <div
            key={account.id}
            className="rounded-2xl border border-border p-4 md:flex md:items-center md:justify-between md:gap-4"
          >
            <div className="min-w-0">
              <p className="font-bold">
                {NETWORK_LABEL[account.network] ?? account.network}
                {account.handle ? (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    @{account.handle}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Seguidores: {formatNumber(account.latest?.followers ?? null)} · Engajamento:{" "}
                {account.latest?.engagement_rate != null
                  ? `${Number(account.latest.engagement_rate).toFixed(2)}%`
                  : "—"}{" "}
                · Atualizado em {formatDate(account.last_synced_at)}
              </p>
              {account.sync_status === "error" && account.sync_error ? (
                <p className="mt-1 text-xs text-destructive">{account.sync_error}</p>
              ) : null}
              {account.sync_status === "pending" ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Coleta em andamento no provedor — tente atualizar em alguns minutos.
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2 md:mt-0">
              <button
                type="button"
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate(account.id)}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-60"
              >
                Atualizar agora
              </button>
              <button
                type="button"
                disabled={disconnectMutation.isPending}
                onClick={() => disconnectMutation.mutate(account.id)}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
              >
                Desconectar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
