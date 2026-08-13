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
  adminSetHandle,
  adminSetYouTubeKey,
  adminSyncProfile,
} from "@/lib/social.functions";


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

  const filtered = (profiles ?? []).filter((p) => p.status === tab);

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
            {(profiles ?? []).filter((p) => p.status === s).length})
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
                to="/$slug"
                params={{ slug: p.slug }}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
              >
                Ver perfil
              </Link>
              <AdminSocialTools profileId={p.id} />
              {p.status !== "approved" && (
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

const ADMIN_NETWORKS = ["instagram", "tiktok", "youtube", "facebook"] as const;

/** Lets the curation team correct a creator's @ and force a public refresh. */
function AdminSocialTools({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [network, setNetwork] = useState<(typeof ADMIN_NETWORKS)[number]>("instagram");
  const [handle, setHandle] = useState("");
  const setHandleFn = useServerFn(adminSetHandle);
  const syncFn = useServerFn(adminSyncProfile);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => setHandleFn({ data: { profileId, network, handle: handle.trim() } }),
    onSuccess: (result) => {
      if (result.error) toast.warning(`Salvo, mas a coleta falhou: ${result.error}`);
      else toast.success("@ salvo e métricas atualizadas");
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
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
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

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
        <div className="mt-2 flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border p-3">
          <select
            value={network}
            onChange={(event) =>
              setNetwork(event.target.value as (typeof ADMIN_NETWORKS)[number])
            }
            className="rounded-xl border border-input bg-background px-3 py-2 text-xs"
          >
            {ADMIN_NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n}
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
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            {saveMutation.isPending ? "Buscando…" : "Salvar e buscar"}
          </button>
        </div>
      ) : null}
    </>
  );
}
