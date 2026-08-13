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
