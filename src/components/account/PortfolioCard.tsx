import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { removeMyWork, upsertMyWork } from "@/lib/account.functions";
import { fetchLinkPreview } from "@/lib/link-preview.functions";
import { fieldCls, labelCls } from "@/lib/profile-options";

type Work = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
};

type Draft = {
  id: string | null;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
};

const emptyDraft: Draft = {
  id: null,
  title: "",
  description: "",
  image_url: "",
  link_url: "",
};

export function PortfolioCard({ works }: { works: Work[] }) {
  const queryClient = useQueryClient();
  const upsert = useServerFn(upsertMyWork);
  const remove = useServerFn(removeMyWork);
  const preview = useServerFn(fetchLinkPreview);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [importing, setImporting] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });

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

  const removeMutation = useMutation({
    mutationFn: (workId: string) => remove({ data: { workId } }),
    onSuccess: () => {
      toast.success("Trabalho removido");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openNew() {
    setDraft(emptyDraft);
    setOpen(true);
  }

  function openEdit(work: Work) {
    setDraft({
      id: work.id,
      title: work.title,
      description: work.description ?? "",
      image_url: work.image_url ?? "",
      link_url: work.link_url ?? "",
    });
    setOpen(true);
  }

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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não conseguimos importar a prévia",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold">Portfólio</h2>
        <button
          type="button"
          onClick={openNew}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
        >
          Adicionar trabalho
        </button>
      </div>

      {works.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {works.map((work) => (
            <article
              key={work.id}
              className="overflow-hidden rounded-2xl border border-border bg-background"
            >
              {work.image_url ? (
                work.link_url ? (
                  <a href={work.link_url} target="_blank" rel="noreferrer noopener">
                    <img
                      src={work.image_url}
                      alt={work.title}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={work.image_url}
                    alt={work.title}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  Sem prévia
                </div>
              )}
              <div className="space-y-2 p-4">
                <h3 className="text-sm font-bold">{work.title}</h3>
                {work.description ? (
                  <p className="text-xs text-muted-foreground">{work.description}</p>
                ) : null}
                {work.link_url ? (
                  <a
                    href={work.link_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver post <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(work)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(work.id)}
                    disabled={removeMutation.isPending}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-accent disabled:opacity-60"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhum trabalho cadastrado.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {draft.id ? "Editar trabalho" : "Adicionar trabalho"}
            </DialogTitle>
          </DialogHeader>
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
              <span className={labelCls}>Link do post (Reel, TikTok, Facebook…)</span>
              <input
                className={fieldCls}
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={draft.link_url}
                onChange={(event) => setDraft({ ...draft, link_url: event.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={importPreview}
              disabled={importing}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent disabled:opacity-60"
            >
              {importing ? "Importando prévia..." : "Importar prévia do link"}
            </button>
            <ImageUpload
              label="Imagem do trabalho"
              value={draft.image_url}
              onChange={(url) => setDraft({ ...draft, image_url: url })}
            />
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
            <DialogFooter>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
