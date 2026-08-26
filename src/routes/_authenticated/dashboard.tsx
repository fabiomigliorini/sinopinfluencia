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
import { ProfileView } from "@/components/ProfileView";
import {
  AddBrandButton,
  AddNicheButton,
  AddSocialButton,
  AddWorkButton,
  EditBasicsButton,
  EditFormatsButton,
  SocialActions,
  WorkActions,
  useRemoveBrand,
  useRemoveNiche,
} from "@/components/account/edit-controls";
import { ConsentDialog } from "@/components/ConsentDialog";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Minha conta, Sinop Influencia" },
      {
        name: "description",
        content:
          "Acompanhe o status do seu perfil de criador na vitrine oficial Sinop Influencia e envie para curadoria da ACES.",
      },
      { property: "og:title", content: "Minha conta, Sinop Influencia" },
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

  const removeNiche = useRemoveNiche(profile?.niche ?? null);
  const removeBrand = useRemoveBrand();

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-7">
      <EmailVerificationBanner />
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
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitMutation.isPending ? "Publicando..." : "Publicar alterações"}
            </button>
          )}
        </div>
      )}

      {profile && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="glass-panel p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">
              Preenchimento
            </h3>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {Math.round((completeness / 6) * 100)}%
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#FFEB00]"
                style={{ width: `${(completeness / 6) * 100}%` }}
              />
            </div>
          </div>
          <div className="glass-panel p-6 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">
              Resumo
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-white/80">
              <li>{data?.socialAccounts.length ?? 0} redes vinculadas</li>
              <li>{data?.formats.length ?? 0} formatos</li>
              <li>{data?.works.length ?? 0} itens no portfólio</li>
              <li>{data?.brands.length ?? 0} marcas parceiras</li>
            </ul>
          </div>
        </div>
      )}

      {profile && (
        <div className="mt-6">
          <ProfileView
            data={{
              profile,
              formats: data?.formats ?? [],
              works: data?.works ?? [],
              brands: data?.brands ?? [],
              socialAccounts: data?.socialAccounts ?? [],
            }}
            edit={{
              extraBadges: (
                <>
                  <span
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest ${status?.tone}`}
                  >
                    {status?.label}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                    /criador/{profile.slug}
                  </span>
                </>
              ),
              heroActions: (
                <>
                  <ImageUpload
                    hidePreview
                    hideRemove
                    aspect={3 / 4}
                    value={profile.avatar_url ?? ""}
                    onChange={(url) => avatarMutation.mutate(url)}
                    buttonClassName="glass-btn px-5 py-2.5 font-bold"
                  />
                  <EditBasicsButton profile={profile} />
                  {profile.status === "approved" && (
                    <Link
                      to="/criador/$slug"
                      params={{ slug: profile.slug }}
                      className="glass-btn px-5 py-2.5 font-bold"
                    >
                      Ver perfil público
                    </Link>
                  )}
                  {avatarMutation.isPending ? (
                    <span className="text-xs text-white/70">Salvando foto…</span>
                  ) : null}
                </>
              ),
              heroNote: <p className="text-sm text-white/60">{status?.hint}</p>,
              sectionActions: {
                sobre: <EditBasicsButton profile={profile} light />,
                redes: <AddSocialButton />,
                portfolio: <AddWorkButton />,
                formatos: (
                  <EditFormatsButton
                    formats={(data?.formats ?? []).map((f) => f.format)}
                  />
                ),
                marcas: <AddBrandButton />,
              },
              addNicheButton: <AddNicheButton niche={profile.niche} />,
              onRemoveNiche: removeNiche,
              onRemoveBrand: removeBrand,
              workActions: (work) => <WorkActions work={work} />,
              socialActions: (account) => <SocialActions account={account} />,
            }}
          />
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
