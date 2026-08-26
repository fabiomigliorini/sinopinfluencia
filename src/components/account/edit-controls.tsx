import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { PhoneInput } from "@/components/PhoneInput";
import { SocialAccountWizard } from "@/components/SocialAccountWizard";
import {
  addMyBrand,
  removeMyBrand,
  removeMyWork,
  setMyFormats,
  setMyNiches,
  setMySlug,
  updateMyBasics,
  upsertMyWork,
  type BasicsInput,
} from "@/lib/account.functions";
import { fetchLinkPreview } from "@/lib/link-preview.functions";
import {
  getSocialIntegrationStatus,
  removeMyAccount,
  setDeclaredFollowers,
  syncMyAccount,
} from "@/lib/social.functions";
import {
  FORMAT_OPTIONS,
  NETWORKS,
  NICHE_OPTIONS,
  fieldCls,
  labelCls,
  normalizeSlug,
  splitNiches,
} from "@/lib/profile-options";
import { networkLabel } from "@/components/network-icons";
import type { Database } from "@/integrations/supabase/types";
import type { PublicSocialAccount } from "@/lib/social-public";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Work = Database["public"]["Tables"]["profile_works"]["Row"];

const pillBtn =
  "rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50";
const sectionBtn =
  "rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition hover:bg-accent disabled:opacity-50";
const pillBtnDanger =
  "rounded-full border border-white/25 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-destructive hover:bg-destructive/20 hover:text-white disabled:opacity-50";
const primaryBtn =
  "rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60";
const neutralBtn =
  "rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-accent";

function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["my-profile"] });
}

/* ============================ INFORMAÇÕES BÁSICAS ============================ */

const emptyForm = {
  display_name: "",
  full_name: "",
  slug: "",
  city: "Sinop, MT",
  tagline: "",
  bio: "",
  main_network: "",
  whatsapp: "",
  email: "",
};

export function EditBasicsButton({
  profile,
  light = false,
}: {
  profile: Profile;
  light?: boolean;
}) {
  const save = useServerFn(updateMyBasics);
  const saveSlug = useServerFn(setMySlug);
  const invalidate = useInvalidateProfile();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      display_name: profile.display_name ?? "",
      full_name: profile.full_name ?? "",
      slug: profile.slug ?? "",
      city: profile.city ?? "Sinop, MT",
      tagline: profile.tagline ?? "",
      bio: profile.bio ?? "",
      main_network: profile.main_network ?? "",
      whatsapp: profile.whatsapp ?? "",
      email: profile.email ?? "",
    });
  }, [profile, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const slug = normalizeSlug(form.slug);
      if (slug && slug !== profile.slug) {
        await saveSlug({ data: { slug } });
      }
      return save({
        data: {
          display_name: form.display_name.trim(),
          full_name: form.full_name.trim() || null,
          city: form.city.trim() || null,
          tagline: form.tagline.trim() || null,
          bio: form.bio.trim() || null,
          main_network: (form.main_network || null) as BasicsInput["main_network"],
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Informações salvas");
      setOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={light ? sectionBtn : "glass-btn px-5 py-2.5 font-bold"}
      >
        Editar informações
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Informações básicas</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="space-y-1.5">
            <span className={labelCls}>Nome público *</span>
            <input
              className={fieldCls}
              required
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Nome completo</span>
            <input
              className={fieldCls}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className={labelCls}>Endereço do perfil</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/criador/</span>
              <input
                className={fieldCls}
                value={form.slug}
                maxLength={60}
                placeholder="fabio.migliorini"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                onBlur={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })}
              />
            </div>
            <span className="block text-xs text-muted-foreground">
              Use letras, números, ponto ou hífen. Este é o link público do seu perfil.
            </span>
          </label>

          <label className="space-y-1.5">
            <span className={labelCls}>Cidade</span>
            <input
              className={fieldCls}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>Rede principal</span>
            <select
              className={fieldCls}
              value={form.main_network}
              onChange={(e) => setForm({ ...form, main_network: e.target.value })}
            >
              <option value="">Selecione</option>
              {NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className={labelCls}>WhatsApp</span>
            <PhoneInput
              value={form.whatsapp}
              onChange={(next) => setForm({ ...form, whatsapp: next })}
            />
            <span className="block text-xs text-muted-foreground">
              Selecione o país ou digite o número completo com +55.
            </span>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className={labelCls}>E-mail para contato</span>
            <input
              className={fieldCls}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className={labelCls}>Descrição curta (card)</span>
            <textarea
              className={`${fieldCls} min-h-[70px] resize-y`}
              maxLength={160}
              placeholder="Ex.: Conteúdo de tecnologia e negócios para o agro de Sinop."
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
            <span className="block text-xs text-muted-foreground">
              Aparece nos cards da vitrine e da home. Até 160 caracteres (
              {form.tagline.length}/160).
            </span>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className={labelCls}>Sobre</span>
            <textarea
              className={`${fieldCls} min-h-[120px] resize-y`}
              maxLength={500}
              placeholder="Conte como você trabalha, seu público e o que entrega para as marcas."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <span className="block text-xs text-muted-foreground">
              Texto exibido na sua página pública. Até 500 caracteres ({form.bio.length}/500).
            </span>
          </label>

          <DialogFooter className="md:col-span-2">
            <button type="submit" disabled={mutation.isPending} className={primaryBtn}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ================================== NICHOS ================================== */

export function AddNicheButton({ niche }: { niche: string | null }) {
  const save = useServerFn(setMyNiches);
  const invalidate = useInvalidateProfile();
  const current = splitNiches(niche);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: (niches: string[]) => save({ data: { niches } }),
    onError: (error: Error) => toast.error(error.message),
  });

  function add() {
    const name = value.trim();
    if (!name) return;
    if (current.some((n) => n.toLowerCase() === name.toLowerCase())) {
      toast.info("Esse nicho já está na sua lista");
      return;
    }
    mutation.mutate([...current, name], {
      onSuccess: () => {
        toast.success("Nicho adicionado");
        setValue("");
        setOpen(false);
        void invalidate();
      },
    });
  }

  const suggestions = NICHE_OPTIONS.filter(
    (option) => !current.some((n) => n.toLowerCase() === option.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-full border border-dashed border-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70 transition hover:border-white/60 hover:text-white">
        + Adicionar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Adicionar nicho</DialogTitle>
          <p className="text-sm text-muted-foreground">
            As opções abaixo são apenas sugestões. Você pode digitar qualquer nicho que achar
            mais adequado ao seu perfil.
          </p>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <label className="block space-y-1.5">
            <span className={labelCls}>Nicho</span>
            <input
              className={fieldCls}
              list="niche-suggestions"
              required
              maxLength={60}
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ex.: Gastronomia"
            />
            <datalist id="niche-suggestions">
              {suggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>

          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 10).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue(option)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                {option}
              </button>
            ))}
          </div>

          <DialogFooter>
            <button type="submit" disabled={mutation.isPending} className={primaryBtn}>
              {mutation.isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useRemoveNiche(niche: string | null) {
  const save = useServerFn(setMyNiches);
  const invalidate = useInvalidateProfile();
  const mutation = useMutation({
    mutationFn: (niches: string[]) => save({ data: { niches } }),
    onSuccess: () => {
      toast.success("Nicho removido");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (name: string) =>
    mutation.mutate(splitNiches(niche).filter((n) => n !== name));
}

/* ================================= FORMATOS ================================= */

export function EditFormatsButton({ formats }: { formats: string[] }) {
  const save = useServerFn(setMyFormats);
  const invalidate = useInvalidateProfile();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(formats);

  useEffect(() => {
    setSelected(formats);
  }, [formats, open]);

  const mutation = useMutation({
    mutationFn: () => save({ data: { formats: selected } }),
    onSuccess: () => {
      toast.success("Formatos atualizados");
      setOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function toggle(option: string) {
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={sectionBtn}>Editar</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Formatos de trabalho</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={primaryBtn}
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================== MARCAS ================================== */

function capitalizeBrand(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed[0]!.toUpperCase() + trimmed.slice(1) : trimmed;
}

function splitBrands(value: string) {
  return value
    .split(/[,;]/)
    .map((part) => capitalizeBrand(part))
    .filter(Boolean);
}

export function AddBrandButton() {
  const add = useServerFn(addMyBrand);
  const invalidate = useInvalidateProfile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [confirmSplit, setConfirmSplit] = useState(false);

  const parts = splitBrands(name);

  const addMutation = useMutation({
    mutationFn: async (names: string[]) => {
      for (const brandName of names) {
        await add({ data: { brandName } });
      }
    },
    onSuccess: (_data, names) => {
      toast.success(names.length > 1 ? `${names.length} marcas adicionadas` : "Marca adicionada");
      setName("");
      setConfirmSplit(false);
      setOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmSplit(false);
      }}
    >
      <DialogTrigger className={sectionBtn}>Adicionar marca</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Adicionar marca</DialogTitle>
        </DialogHeader>
        {confirmSplit ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Encontramos {parts.length} nomes separados por vírgula. Você está digitando
              várias marcas ou é o nome de uma única marca?
            </p>
            <ul className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              {parts.map((part) => (
                <li key={part}>• {part}</li>
              ))}
            </ul>
            <DialogFooter className="gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={addMutation.isPending}
                className={primaryBtn}
                onClick={() => addMutation.mutate(parts)}
              >
                {addMutation.isPending ? "Adicionando..." : `Adicionar ${parts.length} marcas`}
              </button>
              <button
                type="button"
                disabled={addMutation.isPending}
                className={neutralBtn}
                onClick={() => addMutation.mutate([capitalizeBrand(name)])}
              >
                É uma só marca
              </button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              if (parts.length > 1) {
                setConfirmSplit(true);
                return;
              }
              addMutation.mutate([capitalizeBrand(name)]);
            }}
          >
            <label className="space-y-1.5 block">
              <span className={labelCls}>Nome da marca</span>
              <input
                className={fieldCls}
                required
                maxLength={200}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: MG Papelaria"
              />
              <span className="block text-xs text-muted-foreground">
                Você pode separar várias marcas por vírgula — vamos confirmar antes de salvar.
              </span>
            </label>
            <DialogFooter>
              <button type="submit" disabled={addMutation.isPending} className={primaryBtn}>
                {addMutation.isPending ? "Adicionando..." : "Adicionar"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


export function useRemoveBrand() {
  const remove = useServerFn(removeMyBrand);
  const invalidate = useInvalidateProfile();
  const mutation = useMutation({
    mutationFn: (brandId: string) => remove({ data: { brandId } }),
    onSuccess: () => {
      toast.success("Marca removida");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (brandId: string) => mutation.mutate(brandId);
}

/* ================================ PORTFÓLIO ================================ */

type WorkDraft = {
  id: string | null;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
};

const emptyWorkDraft: WorkDraft = {
  id: null,
  title: "",
  description: "",
  image_url: "",
  link_url: "",
};

function WorkDialog({
  work,
  trigger,
}: {
  work?: Work;
  trigger: React.ReactNode;
}) {
  const upsert = useServerFn(upsertMyWork);
  const preview = useServerFn(fetchLinkPreview);
  const invalidate = useInvalidateProfile();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<WorkDraft>(emptyWorkDraft);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!open) return;
    if (work) {
      setDraft({
        id: work.id,
        title: work.title,
        description: work.description ?? "",
        image_url: work.image_url ?? "",
        link_url: work.link_url ?? "",
      });
      setStep(2);
    } else {
      setDraft(emptyWorkDraft);
      setStep(1);
    }
  }, [open, work]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          id: draft.id,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          image_url: draft.image_url.trim() || null,
          link_url: draft.link_url.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Trabalho salvo");
      setOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function importPreview() {
    const url = draft.link_url.trim();
    if (!url) {
      toast.error("Cole o link do post primeiro");
      return;
    }
    setImporting(true);
    try {
      const result = await preview({ data: { url } });
      if (!result.ok) {
        toast.warning(result.error);
        return;
      }
      setDraft((current) => ({
        ...current,
        image_url: result.image ?? current.image_url,
        title: current.title || (result.title ?? ""),
      }));
      toast.success("Prévia importada");
      setStep(2);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não conseguimos importar a prévia",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Editar trabalho" : "Adicionar trabalho"}</DialogTitle>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-xs font-semibold">
          {["Link", "Imagem", "Detalhes"].map((label, index) => {
            const stepNumber = index + 1;
            const active = step === stepNumber;
            return (
              <li
                key={label}
                className={`rounded-full px-3 py-1 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber}. {label}
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className={labelCls}>Link do post (Reel, TikTok, Facebook…)</span>
              <input
                className={fieldCls}
                type="url"
                autoFocus
                disabled={Boolean(draft.id)}
                placeholder="https://www.instagram.com/reel/..."
                value={draft.link_url}
                onChange={(event) => setDraft({ ...draft, link_url: event.target.value })}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {draft.id
                ? "O link do post não pode ser alterado. Para trocar, remova este trabalho e adicione outro."
                : "Importe a prévia para preencher imagem e título automaticamente, ou pule esta etapa."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={importPreview}
                disabled={importing}
                className={primaryBtn}
              >
                {importing ? "Importando prévia..." : "Importar prévia do link"}
              </button>
              <button type="button" onClick={() => setStep(2)} className={neutralBtn}>
                Pular
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <ImageUpload
              label="Imagem do trabalho"
              aspect={16 / 9}
              value={draft.image_url}
              onChange={(url) => setDraft({ ...draft, image_url: url })}
            />
            <p className="text-xs text-muted-foreground">
              Mantenha a imagem importada ou envie outra.
            </p>
            <DialogFooter className="gap-2 sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className={neutralBtn}>
                Voltar
              </button>
              <button type="button" onClick={() => setStep(3)} className={primaryBtn}>
                Continuar
              </button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <label className="block space-y-1.5">
              <span className={labelCls}>Título *</span>
              <input
                className={fieldCls}
                required
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelCls}>Descrição</span>
              <textarea
                className={`${fieldCls} min-h-[90px] resize-y`}
                placeholder="Descrição rápida do resultado"
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </label>
            <DialogFooter className="gap-2 sm:justify-between">
              <button type="button" onClick={() => setStep(2)} className={neutralBtn}>
                Voltar
              </button>
              <button type="submit" disabled={saveMutation.isPending} className={primaryBtn}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AddWorkButton() {
  return (
    <WorkDialog
      trigger={
        <button type="button" className={sectionBtn}>
          Adicionar trabalho
        </button>
      }
    />
  );
}

export function WorkActions({ work }: { work: Work }) {
  const remove = useServerFn(removeMyWork);
  const invalidate = useInvalidateProfile();

  const removeMutation = useMutation({
    mutationFn: () => remove({ data: { workId: work.id } }),
    onSuccess: () => {
      toast.success("Trabalho removido");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <WorkDialog
        work={work}
        trigger={
          <button type="button" className={pillBtn}>
            Editar
          </button>
        }
      />
      <button
        type="button"
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        className={pillBtnDanger}
      >
        Remover
      </button>
    </>
  );
}

/* ================================ REDES SOCIAIS ================================ */

export function AddSocialButton() {
  const fetchStatus = useServerFn(getSocialIntegrationStatus);
  const invalidate = useInvalidateProfile();
  const [wizardOpen, setWizardOpen] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["social-status"],
    queryFn: () => fetchStatus({}),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className={sectionBtn}
      >
        Vincular nova rede
      </button>
      <SocialAccountWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onDone={() => void invalidate()}
        youtubeEnabled={statusQuery.data?.youtubeEnabled ?? false}
      />
    </>
  );
}

export function SocialActions({ account }: { account: PublicSocialAccount }) {
  const runSync = useServerFn(syncMyAccount);
  const runRemove = useServerFn(removeMyAccount);
  const runDeclare = useServerFn(setDeclaredFollowers);
  const invalidate = useInvalidateProfile();

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    followers: "",
    posts: "",
    likes: "",
    views: "",
  });

  const syncMutation = useMutation({
    mutationFn: () => runSync({ data: { accountRowId: account.id } }),
    onSuccess: (result) => {
      if (result && (result as { ok?: boolean }).ok === false) {
        toast.error(
          (result as { error?: string }).error ?? "Não foi possível coletar os dados agora.",
        );
      } else {
        toast.success("Dados atualizados!");
      }
      void invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      void invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => runRemove({ data: { accountRowId: account.id } }),
    onSuccess: () => {
      toast.success("Rede removida.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const declareMutation = useMutation({
    mutationFn: () =>
      runDeclare({
        data: {
          accountRowId: account.id,
          followers: manualForm.followers.trim(),
          posts: manualForm.posts.trim(),
          likes: manualForm.likes.trim(),
          views: manualForm.views.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Números atualizados.");
      setManualOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openManual() {
    setManualForm({
      followers: account.latest?.followers != null ? String(account.latest.followers) : "",
      posts: account.latest?.posts_count != null ? String(account.latest.posts_count) : "",
      likes: account.latest?.avg_likes != null ? String(account.latest.avg_likes) : "",
      views: account.latest?.avg_views != null ? String(account.latest.avg_views) : "",
    });
    setManualOpen(true);
  }

  return (
    <>
      <button
        type="button"
        disabled={syncMutation.isPending}
        onClick={() => syncMutation.mutate()}
        className={pillBtn}
      >
        Atualizar agora
      </button>
      <button type="button" onClick={openManual} className={pillBtn}>
        Informar manualmente
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Remover @${account.handle} do ${networkLabel(account.network)}?`))
            removeMutation.mutate();
        }}
        disabled={removeMutation.isPending}
        className={pillBtnDanger}
      >
        Remover
      </button>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informar números manualmente</DialogTitle>
            <DialogDescription>
              {`${networkLabel(account.network)} · @${account.handle}. `}
              Os valores informados aparecem no perfil como declarados pelo criador.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "followers", label: "Seguidores", placeholder: "Ex.: 18400" },
                { key: "posts", label: "Posts", placeholder: "Ex.: 291" },
                { key: "likes", label: "Curtidas", placeholder: "Ex.: 1200" },
                { key: "views", label: "Views", placeholder: "Ex.: 8500" },
              ] as const
            ).map((f) => (
              <label key={f.key} className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {f.label}
                </span>
                <input
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                  placeholder={f.placeholder}
                  inputMode="numeric"
                  maxLength={20}
                  value={manualForm[f.key]}
                  onChange={(e) => setManualForm({ ...manualForm, [f.key]: e.target.value })}
                />
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="rounded-full border border-border px-5 py-2 text-xs font-bold transition hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={declareMutation.isPending}
              onClick={() => declareMutation.mutate()}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
