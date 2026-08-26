import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setMyNiches } from "@/lib/account.functions";
import {
  NICHE_OPTIONS,
  fieldCls,
  labelCls,
  splitNiches,
} from "@/lib/profile-options";

export function NichesCard({ niche }: { niche: string | null }) {
  const queryClient = useQueryClient();
  const save = useServerFn(setMyNiches);
  const current = splitNiches(niche);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: (niches: string[]) => save({ data: { niches } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
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
      },
    });
  }

  function remove(name: string) {
    mutation.mutate(
      current.filter((n) => n !== name),
      { onSuccess: () => toast.success("Nicho removido") },
    );
  }

  const suggestions = NICHE_OPTIONS.filter(
    (option) => !current.some((n) => n.toLowerCase() === option.toLowerCase()),
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold">Nichos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent">
            Adicionar nicho
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Adicionar nicho</DialogTitle>
              <p className="text-sm text-muted-foreground">
                As opções abaixo são apenas sugestões. Você pode digitar qualquer nicho que achar mais adequado ao seu perfil.
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
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-[1.03] hover:bg-primary/90 disabled:opacity-60"
                >
                  {mutation.isPending ? "Adicionando..." : "Adicionar"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {current.length ? (
          current.map((name) => (
            <span
              key={name}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {name}
              <button
                type="button"
                aria-label={`Remover ${name}`}
                onClick={() => remove(name)}
                disabled={mutation.isPending}
                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum nicho informado. Adicione ao menos um para a curadoria.
          </p>
        )}
      </div>
    </section>
  );
}
