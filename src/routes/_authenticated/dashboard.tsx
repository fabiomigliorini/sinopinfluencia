import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import {
  getMyProfile,
  submitMyProfile,
  getMyRole,
  setMyAvatar,
} from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { SocialAccountCards } from "@/components/SocialAccountCards";
import { BasicInfoCard } from "@/components/account/BasicInfoCard";
import { FormatsCard } from "@/components/account/FormatsCard";
import { BrandsCard } from "@/components/account/BrandsCard";
import { NichesCard } from "@/components/account/NichesCard";
import { PortfolioCard } from "@/components/account/PortfolioCard";
import { ConsentDialog } from "@/components/ConsentDialog";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Minha conta — Sinop Influencia" },
      {
        name: "description",
        content:
          "Acompanhe o status do seu perfil de criador na vitrine oficial Sinop Influencia e envie para curadoria da ACES.",
      },
      { property: "og:title", content: "Minha conta — Sinop Influencia" },
      {
        property: "og:description",
        content: "Gerencie seu perfil de criador na vitrine oficial Sinop Influencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const statusLabel: Record<string, { label: string; tone: string; hint: string }> = {
  draft: {
    label: "Rascunho",
    tone: "bg-muted text-foreground",
    hint: "Complete seu perfil e envie para a curadoria da ACES.",
  },
  pending: {
    label: "Em análise",
    tone: "bg-[#FFEB00] text-[#0D4424]",
    hint: "Recebemos seu perfil. A curadoria responde em até 5 dias úteis.",
  },
  approved: {
    label: "Aprovado",
    tone: "bg-primary text-primary-foreground",
    hint: "Seu perfil está publicado na vitrine oficial.",
  },
  rejected: {
    label: "Ajustes necessários",
    tone: "bg-destructive text-destructive-foreground",
    hint: "A curadoria pediu ajustes. Revise as informações e envie novamente.",
  },
};

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRole = useServerFn(getMyRole);
  const submit = useServerFn(submitMyProfile);
  const saveAvatar = useServerFn(setMyAvatar);
  const [consentOpen, setConsentOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole() });

  const submitMutation = useMutation({
    mutationFn: () => submit(),
    onSuccess: () => {
      toast.success("Perfil enviado para curadoria!");
      setConsentOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const avatarMutation = useMutation({
    mutationFn: (avatarUrl: string) => saveAvatar({ data: { avatarUrl } }),
    onSuccess: () => {
      toast.success("Foto atualizada");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const profile = data?.profile;
  const status = profile ? statusLabel[profile.status] : undefined;
  const hasPendingChanges = profile
    ? new Date(profile.content_changed_at).getTime() >
      new Date(profile.submitted_at ?? 0).getTime()
    : false;
  const banner = profile
    ? hasPendingChanges
      ? {
          tone: "border-[#FFEB00] bg-[#FFEB00]/15",
          title:
            profile.status === "draft"
              ? "Perfil ainda não enviado"
              : "Você tem alterações não publicadas",
          text:
            profile.status === "draft"
              ? "Complete as informações e publique para a curadoria da ACES avaliar."
              : "As mudanças feitas depois do último envio só aparecem na vitrine após publicar novamente.",
        }
      : profile.status === "pending"
        ? {
            tone: "border-border bg-muted/50",
            title: "Enviado para curadoria",
            text: "Nenhuma alteração pendente. A ACES responde em até 5 dias úteis.",
          }
        : profile.status === "approved"
          ? profile.review_pending
            ? {
                tone: "border-[#FFEB00] bg-[#FFEB00]/15",
                title: "Alterações em análise",
                text: "Seu perfil continua no ar na vitrine enquanto a curadoria da ACES revisa as últimas mudanças.",
              }
            : {
                tone: "border-primary/40 bg-primary/10",
                title: "Perfil publicado e atualizado",
                text: "Tudo que você editou já está no ar na vitrine oficial.",
              }
          : {
              tone: "border-destructive/40 bg-destructive/10",
              title: "A curadoria pediu ajustes",
              text: "Revise as informações e publique novamente para nova análise.",
            }
    : undefined;
  const completeness = profile
    ? [
        profile.bio,
        profile.niche,
        profile.whatsapp,
        profile.main_network,
        data?.socialAccounts.length ? "x" : null,
        data?.formats.length ? "x" : null,
      ].filter(Boolean).length
    : 0;


  return (
    <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Minha conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seu perfil na vitrine oficial de criadores de Sinop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role?.isAdmin && (
            <Link
              to="/admin/perfis"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
            >
              Painel de curadoria
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
          >
            Sair
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 h-40 animate-pulse rounded-3xl border border-border bg-card" />
      )}

      {!isLoading && !profile && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">
            Não encontramos um perfil vinculado à sua conta. Recarregue a página em alguns
            segundos ou entre em contato com a ACES.
          </p>
        </div>
      )}

      {profile && banner && (
        <div
          className={`mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 ${banner.tone}`}
        >
          <div>
            <p className="text-sm font-bold">{banner.title}</p>
            <p className="mt-1 text-sm text-foreground/75">{banner.text}</p>
          </div>
          {hasPendingChanges && (
            <button
              onClick={() => setConsentOpen(true)}
              disabled={submitMutation.isPending}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitMutation.isPending ? "Publicando..." : "Publicar alterações"}
            </button>
          )}
        </div>
      )}

      {profile && (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">

          <section className="rounded-3xl border border-border bg-card p-7">
            <div className="mb-6 max-w-[260px]">
              <ImageUpload
                label="Foto de perfil"
                round
                value={profile.avatar_url ?? ""}
                onChange={(url) => avatarMutation.mutate(url)}
              />
              {avatarMutation.isPending ? (
                <p className="mt-2 text-xs text-muted-foreground">Salvando foto…</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${status?.tone}`}
              >
                {status?.label}
              </span>
              <span className="text-xs text-muted-foreground">
                /{profile.slug}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{profile.display_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.niche ?? "Nicho não informado"} · {profile.city ?? "Sinop, MT"}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {profile.bio ?? "Você ainda não escreveu sua bio."}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">{status?.hint}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {hasPendingChanges && (
                <button
                  onClick={() => setConsentOpen(true)}
                  disabled={submitMutation.isPending}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitMutation.isPending
                    ? "Publicando..."
                    : profile.status === "draft"
                      ? "Publicar e enviar para curadoria"
                      : "Publicar alterações"}
                </button>
              )}

              {profile.status === "approved" && (
                <Link
                  to="/criador/$slug"
                  params={{ slug: profile.slug }}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold transition hover:bg-accent"
                >
                  Ver perfil público
                </Link>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Preenchimento
              </h3>
              <p className="mt-3 text-3xl font-extrabold">
                {Math.round((completeness / 6) * 100)}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(completeness / 6) * 100}%` }}
                />
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 text-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Resumo
              </h3>
              <ul className="mt-3 space-y-2 text-foreground/80">
                <li>{data?.socialAccounts.length ?? 0} redes vinculadas</li>
                <li>{data?.formats.length ?? 0} formatos de trabalho</li>
                <li>{data?.works.length ?? 0} itens no portfólio</li>
                <li>{data?.brands.length ?? 0} marcas parceiras</li>
              </ul>
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-2">
            <BasicInfoCard profile={profile} />
          <NichesCard niche={profile.niche} />
            <SocialAccountCards />
            <FormatsCard formats={(data?.formats ?? []).map((f) => f.format)} />
            <BrandsCard brands={data?.brands ?? []} />
            <PortfolioCard works={data?.works ?? []} />
          </div>
        </div>
      )}

      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        onConfirm={() => submitMutation.mutate()}
        isPending={submitMutation.isPending}
      />
    </div>
  );
}
