import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfileForAdmin } from "@/lib/account.functions";
import { ProfileView, type ProfileViewData } from "@/components/ProfileView";
import { tierLabel } from "@/lib/tiers";

export const Route = createFileRoute("/_authenticated/admin/perfis_/$id")({
  component: AdminProfilePreview,
  head: () => ({
    meta: [
      { title: "Pré-visualização de perfil — Sinop Influencia" },
      {
        name: "description",
        content:
          "Pré-visualização de curadoria de um perfil de criador antes da aprovação na vitrine Sinop Influencia.",
      },
      { property: "og:title", content: "Pré-visualização de perfil — Sinop Influencia" },
      {
        property: "og:description",
        content: "Painel interno de curadoria da vitrine Sinop Influencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUS_TEXT: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

function AdminProfilePreview() {
  const { id } = Route.useParams();
  const fetchProfile = useServerFn(getProfileForAdmin);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-profile", id],
    queryFn: async () => (await fetchProfile({ data: { profileId: id } })) as ProfileViewData,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 py-12">
        <div className="h-72 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Perfil não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Não foi possível carregar este perfil."}
        </p>
        <Link
          to="/admin/perfis"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Voltar para a curadoria
        </Link>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div>
      <div className="border-b border-border bg-secondary/50">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-4 lg:px-7">
          <div>
            <span className="rounded-full bg-[#FFEB00] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0D4424]">
              Pré-visualização de curadoria
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Status atual: <strong>{STATUS_TEXT[profile.status] ?? profile.status}</strong> · Nível:{" "}
              <strong>{tierLabel(profile.tier)}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/perfis"
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold transition hover:bg-accent"
            >
              ← Voltar para a curadoria
            </Link>
            {profile.status === "approved" ? (
              <Link
                to="/$slug"
                params={{ slug: profile.slug }}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                Abrir página pública
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <ProfileView data={data} backLink={<span className="sr-only">Pré-visualização</span>} />
    </div>
  );
}
