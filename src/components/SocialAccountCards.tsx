import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { NetworkBadge, networkLabel } from "@/components/network-icons";
import { SocialAccountWizard } from "@/components/SocialAccountWizard";
import {
  getSocialIntegrationStatus,
  listMyAccounts,
  removeMyAccount,
  setDeclaredFollowers,
  syncMyAccount,
} from "@/lib/social.functions";

type Account = {
  id: string;
  network: string;
  handle: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  display_name: string | null;
  is_declared: boolean;
  declared_followers: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  latest: {
    captured_at: string;
    followers: number | null;
    posts_count: number | null;
    avg_likes: number | null;
    avg_views: number | null;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "nunca";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

export function SocialAccountCards() {
  const queryClient = useQueryClient();
  const fetchStatus = useServerFn(getSocialIntegrationStatus);
  const fetchAccounts = useServerFn(listMyAccounts);
  const runSync = useServerFn(syncMyAccount);
  const runRemove = useServerFn(removeMyAccount);
  const runDeclare = useServerFn(setDeclaredFollowers);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [manualFor, setManualFor] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");

  const statusQuery = useQuery({
    queryKey: ["social-status"],
    queryFn: () => fetchStatus({}),
  });
  const accountsQuery = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => (await fetchAccounts({})) as Account[],
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  }

  const syncMutation = useMutation({
    mutationFn: (accountRowId: string) => runSync({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Dados atualizados!");
      refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      refresh();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (accountRowId: string) => runRemove({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Rede removida.");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const declareMutation = useMutation({
    mutationFn: (input: { accountRowId: string; followers: string }) => runDeclare({ data: input }),
    onSuccess: () => {
      toast.success("Número atualizado.");
      setManualFor(null);
      setManualValue("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const accounts = accountsQuery.data ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Perfis em redes sociais</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vincule quantos perfis quiser — inclusive mais de um na mesma rede. Os números públicos
            são atualizados automaticamente todos os dias.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
        >
          Vincular nova rede
        </button>
      </div>

      {statusQuery.data && !statusQuery.data.youtubeEnabled && (
        <p className="mt-4 rounded-2xl bg-accent/60 p-3 text-xs text-muted-foreground">
          O YouTube ficará disponível quando a equipe da ACES configurar a chave da API.
        </p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {accountsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando redes...</p>
        )}
        {!accountsQuery.isLoading && accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma rede vinculada ainda. Clique em “Vincular nova rede”.
          </p>
        )}

        {accounts.map((account) => {
          const followers = account.is_declared
            ? account.declared_followers
            : account.latest?.followers != null
              ? formatNumber(account.latest.followers)
              : null;
          return (
            <article
              key={account.id}
              className="rounded-3xl border border-border p-4 transition hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  {account.avatar_url ? (
                    <img
                      src={account.avatar_url}
                      alt={`Foto do perfil no ${networkLabel(account.network)}`}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <NetworkBadge
                      network={account.network}
                      className="h-14 w-14"
                      iconClassName="h-6 w-6"
                    />
                  )}
                  {account.avatar_url && (
                    <NetworkBadge
                      network={account.network}
                      className="absolute -bottom-1 -right-1 h-6 w-6 ring-2 ring-card"
                      iconClassName="h-3 w-3"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {account.display_name ?? `@${account.handle}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {networkLabel(account.network)} · @{account.handle}
                  </p>
                  <p className="mt-2 text-xl font-black">{followers ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.is_declared
                      ? "Declarado pelo criador"
                      : `Dados públicos · ${formatDate(account.last_synced_at)}`}
                  </p>
                </div>
              </div>

              {!account.is_declared && account.latest && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-accent/50 p-2">
                    <p className="text-muted-foreground">Posts</p>
                    <p className="font-bold">{formatNumber(account.latest.posts_count)}</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-2">
                    <p className="text-muted-foreground">Curtidas</p>
                    <p className="font-bold">{formatNumber(account.latest.avg_likes)}</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-2">
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-bold">{formatNumber(account.latest.avg_views)}</p>
                  </div>
                </div>
              )}

              {account.sync_status === "error" && account.sync_error && (
                <p className="mt-3 rounded-2xl bg-destructive/10 p-2 text-xs text-destructive">
                  {account.sync_error}
                </p>
              )}

              {manualFor === account.id ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    autoFocus
                    className="min-w-[140px] flex-1 rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: 18,4 mil"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={declareMutation.isPending}
                    onClick={() =>
                      declareMutation.mutate({
                        accountRowId: account.id,
                        followers: manualValue.trim(),
                      })
                    }
                    className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFor(null)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={syncMutation.isPending}
                    onClick={() => syncMutation.mutate(account.id)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-50"
                  >
                    Atualizar agora
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualFor(account.id);
                      setManualValue(account.declared_followers ?? "");
                    }}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
                  >
                    Informar manualmente
                  </button>
                  {account.profile_url && (
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
                    >
                      Abrir perfil
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remover @${account.handle} do ${networkLabel(account.network)}?`))
                        removeMutation.mutate(account.id);
                    }}
                    className="rounded-full border border-border px-4 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                  >
                    Remover
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <SocialAccountWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onDone={refresh}
        youtubeEnabled={statusQuery.data?.youtubeEnabled ?? false}
      />
    </section>
  );
}
