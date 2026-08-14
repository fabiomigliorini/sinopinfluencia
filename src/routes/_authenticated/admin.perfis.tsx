import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getMyRole,
  listProfilesForAdmin,
  setProfileStatus,
} from "@/lib/account.functions";
import {
  adminGetYouTubeKeyStatus,
  adminAddAccount,
  adminListAccounts,
  adminRemoveAccount,
  adminSetYouTubeKey,
  adminSyncProfile,
} from "@/lib/social.functions";
import { setProfileTier } from "@/lib/account.functions";
import { NetworkBadge, networkLabel } from "@/components/network-icons";
import { TIER_OPTIONS, type Tier } from "@/lib/tiers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export const Route = createFileRoute("/_authenticated/admin/perfis")({
  component: AdminProfilesPage,
  head: () => ({
    meta: [
      { title: "Curadoria de perfis — Sinop Influencia" },
      {
        name: "description",
        content:
          "Painel da ACES para aprovar, rejeitar e revisar perfis de criadores da vitrine Sinop Influencia.",
      },
      { property: "og:title", content: "Curadoria de perfis — Sinop Influencia" },
      {
        property: "og:description",
        content: "Painel interno de curadoria de criadores da vitrine Sinop Influencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STATUSES = ["pending", "approved", "rejected", "draft"] as const;
type Status = (typeof STATUSES)[number];

const statusTone: Record<Status, string> = {
  pending: "bg-[#FFEB00] text-[#0D4424]",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  draft: "bg-muted text-foreground",
};

const statusText: Record<Status, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
  draft: "Rascunho",
};

function AdminProfilesPage() {
  const queryClient = useQueryClient();
  const fetchRole = useServerFn(getMyRole);
  const fetchProfiles = useServerFn(listProfilesForAdmin);
  const changeStatus = useServerFn(setProfileStatus);
  const [tab, setTab] = useState<Status>("pending");

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole(),
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: () => fetchProfiles(),
    enabled: role?.isAdmin === true,
  });

  const mutation = useMutation({
    mutationFn: (vars: { profileId: string; status: Status }) =>
      changeStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!roleLoading && !role?.isAdmin) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este painel é exclusivo da equipe de curadoria da ACES.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Voltar para minha conta
        </Link>
      </div>
    );
  }

  // Approved profiles that submitted new changes still show up for review.
  const inTab = (p: { status: string; review_pending: boolean }) =>
    tab === "pending"
      ? p.status === "pending" || p.review_pending
      : p.status === tab && !p.review_pending;
  const filtered = (profiles ?? []).filter(inTab);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-7">
      <h1 className="text-3xl font-extrabold tracking-tight">Curadoria de perfis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Revise os perfis enviados e defina quem entra na vitrine oficial.
      </p>

      <YouTubeKeyCard />


      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === s
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-accent"
            }`}
          >
            {statusText[s]} (
            {(profiles ?? []).filter((p) =>
              s === "pending"
                ? p.status === "pending" || p.review_pending
                : p.status === s && !p.review_pending,
            ).length})
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="mt-8 h-32 animate-pulse rounded-3xl border border-border bg-card" />
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="mt-8 rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Nenhum perfil com este status.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-[15px]">{p.display_name}</strong>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    statusTone[p.status as Status]
                  }`}
                >
                  {statusText[p.status as Status]}
                </span>
                {p.review_pending && p.status === "approved" && (
                  <span className="rounded-full bg-[#FFEB00] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0D4424]">
                    Alterações pendentes
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.niche ?? "Sem nicho"} · {p.city ?? "Sinop, MT"} · {p.email ?? "sem e-mail"}
              </p>
              {p.bio && (
                <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-foreground/75">
                  {p.bio}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/perfis/$id"
                params={{ id: p.id }}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
              >
                Ver perfil
              </Link>
              {p.status === "approved" ? (
                <Link
                  to="/criador/$slug"
                  params={{ slug: p.slug }}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
                >
                  Página pública
                </Link>
              ) : null}
              <TierSelect profileId={p.id} tier={p.tier as Tier} />
              <AdminSocialTools profileId={p.id} />
              {(p.status !== "approved" || p.review_pending) && (
                <button
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ profileId: p.id, status: "approved" })
                  }
                  className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  Aprovar
                </button>
              )}
              {p.status !== "rejected" && (
                <button
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ profileId: p.id, status: "rejected" })
                  }
                  className="rounded-full border border-destructive/40 px-4 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                >
                  Rejeitar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Curation control: sets the ACES ladder (1 to 4 stars) for one profile via dialog. */
function TierSelect({ profileId, tier }: { profileId: string; tier: Tier }) {
  const queryClient = useQueryClient();
  const saveTier = useServerFn(setProfileTier);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Tier>(tier);
  const current = TIER_OPTIONS.find((option) => option.value === tier);
  const mutation = useMutation({
    mutationFn: (value: Tier) => saveTier({ data: { profileId, tier: value } }),
    onSuccess: () => {
      toast.success("Nível atualizado");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(tier);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full text-xs font-bold">
          Nível{" "}
          <span className="ml-1">
            {current ? `${"★".repeat(current.stars)} ${current.label}` : tier}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar nível de curadoria</DialogTitle>
          <DialogDescription>
            Escolha a classificação da ACES para este criador e confirme a alteração.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={draft} onValueChange={(value) => setDraft(value as Tier)} className="gap-2">
          {TIER_OPTIONS.map((option) => (
            <Label
              key={option.value}
              htmlFor={`tier-${profileId}-${option.value}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm font-semibold has-[button[data-state=checked]]:border-primary"
            >
              <RadioGroupItem value={option.value} id={`tier-${profileId}-${option.value}`} />
              <span>
                {"★".repeat(option.stars)} {option.label}
              </span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate(draft)}
            disabled={mutation.isPending || draft === tier}
          >
            {mutation.isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const ADMIN_NETWORKS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "linkedin",
  "kwai",
  "twitter",
] as const;

type AdminAccount = {
  id: string;
  network: string;
  handle: string | null;
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

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

/** Lets the curation team see, correct and refresh a creator's linked @s. */
function AdminSocialTools({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [network, setNetwork] = useState<(typeof ADMIN_NETWORKS)[number]>("instagram");
  const [handle, setHandle] = useState("");
  const addAccountFn = useServerFn(adminAddAccount);
  const syncFn = useServerFn(adminSyncProfile);
  const listFn = useServerFn(adminListAccounts);
  const removeFn = useServerFn(adminRemoveAccount);
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ["admin-accounts", profileId],
    queryFn: async () => (await listFn({ data: { profileId } })) as AdminAccount[],
    enabled: open,
  });

  function refreshAccounts() {
    void queryClient.invalidateQueries({ queryKey: ["admin-accounts", profileId] });
    void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      addAccountFn({ data: { profileId, network, handle: handle.trim() } }) as Promise<{
        ok: boolean;
        error: string | null;
      }>,
    onSuccess: (result) => {
      if (result.error) toast.warning(`Salvo, mas a coleta falhou: ${result.error}`);
      else toast.success("@ vinculado e métricas atualizadas");
      setHandle("");
      refreshAccounts();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncFn({ data: { profileId } }),
    onSuccess: (results) => {
      const failed = results.filter((r) => !r.ok);
      if (!results.length) toast.info("Este perfil não tem redes informadas");
      else if (failed.length) toast.warning(`Falhas: ${failed.map((f) => f.network).join(", ")}`);
      else toast.success("Métricas públicas atualizadas");
      refreshAccounts();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (accountRowId: string) => removeFn({ data: { accountRowId } }),
    onSuccess: () => {
      toast.success("Rede removida");
      refreshAccounts();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const accounts = accountsQuery.data ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
      >
        Redes
      </button>
      <button
        type="button"
        disabled={syncMutation.isPending}
        onClick={() => syncMutation.mutate()}
        className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-60"
      >
        {syncMutation.isPending ? "Atualizando…" : "Atualizar métricas"}
      </button>
      {open ? (
        <div className="mt-2 w-full space-y-4 rounded-2xl border border-border p-4">
          {accountsQuery.isLoading ? (
            <div className="h-16 animate-pulse rounded-xl bg-secondary" />
          ) : accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma rede vinculada.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    {account.avatar_url ? (
                      <img
                        src={account.avatar_url}
                        alt={account.handle ?? account.network}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <NetworkBadge
                        network={account.network}
                        className="h-10 w-10"
                        iconClassName="h-4 w-4"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">
                        {account.handle ? `@${account.handle}` : networkLabel(account.network)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {networkLabel(account.network)} ·{" "}
                        {account.is_declared || !account.latest
                          ? "declarado"
                          : "dados públicos"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span>
                      Seguidores:{" "}
                      <strong className="text-foreground">
                        {account.latest?.followers != null
                          ? formatNumber(account.latest.followers)
                          : (account.declared_followers ?? "—")}
                      </strong>
                    </span>
                    <span>
                      Posts:{" "}
                      <strong className="text-foreground">
                        {formatNumber(account.latest?.posts_count)}
                      </strong>
                    </span>
                    <span>
                      Curtidas:{" "}
                      <strong className="text-foreground">
                        {formatNumber(account.latest?.avg_likes)}
                      </strong>
                    </span>
                    <span>
                      Views:{" "}
                      <strong className="text-foreground">
                        {formatNumber(account.latest?.avg_views)}
                      </strong>
                    </span>
                  </div>
                  {account.sync_error ? (
                    <p className="mt-2 text-[11px] text-destructive">{account.sync_error}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate()}
                      className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold transition hover:bg-accent disabled:opacity-60"
                    >
                      Atualizar
                    </button>
                    <button
                      type="button"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(account.id)}
                      className="rounded-full border border-destructive/40 px-3 py-1.5 text-[11px] font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <select
              value={network}
              onChange={(event) =>
                setNetwork(event.target.value as (typeof ADMIN_NETWORKS)[number])
              }
              className="rounded-xl border border-input bg-background px-3 py-2 text-xs"
            >
              {ADMIN_NETWORKS.map((n) => (
                <option key={n} value={n}>
                  {networkLabel(n)}
                </option>
              ))}
            </select>
            <input
              value={handle}
              placeholder="@ ou link do perfil"
              onChange={(event) => setHandle(event.target.value)}
              className="min-w-[180px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs"
            />
            <button
              type="button"
              disabled={saveMutation.isPending || !handle.trim()}
              onClick={() => saveMutation.mutate()}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {saveMutation.isPending ? "Buscando…" : "Salvar e buscar"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Lets the ACES team inform the Google/YouTube API key without touching code. */
function YouTubeKeyCard() {
  const fetchStatus = useServerFn(adminGetYouTubeKeyStatus);
  const saveKey = useServerFn(adminSetYouTubeKey);
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");

  const { data } = useQuery({
    queryKey: ["youtube-key-status"],
    queryFn: () => fetchStatus(),
  });

  const mutation = useMutation({
    mutationFn: (key: string) => saveKey({ data: { key } }),
    onSuccess: (result) => {
      setValue("");
      toast.success(result.removed ? "Chave removida" : "Chave salva");
      void queryClient.invalidateQueries({ queryKey: ["youtube-key-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <strong className="text-[15px]">Chave da API do Google (YouTube)</strong>
          <p className="mt-1 text-xs text-muted-foreground">
            Necessária para coletar inscritos e visualizações dos canais do YouTube.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
            data?.configured ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {data?.configured ? "Configurada" : "Não configurada"}
        </span>
      </div>

      {data?.source === "panel" && data.masked ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Chave atual: <span className="font-mono">{data.masked}</span>
        </p>
      ) : null}
      {data?.source === "secret" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Usando a chave guardada nas configurações do projeto. Informe abaixo para substituir.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={value}
          type="password"
          autoComplete="off"
          placeholder="AIza..."
          onChange={(event) => setValue(event.target.value)}
          className="min-w-[240px] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={mutation.isPending || !value.trim()}
          onClick={() => mutation.mutate(value.trim())}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? "Salvando…" : "Salvar chave"}
        </button>
        {data?.source === "panel" ? (
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate("")}
            className="rounded-full border border-destructive/40 px-4 py-2 text-xs font-bold text-destructive disabled:opacity-60"
          >
            Remover
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Gere em console.cloud.google.com → APIs e serviços → Credenciais, com a
        “YouTube Data API v3” ativada.
      </p>
    </div>
  );
}
