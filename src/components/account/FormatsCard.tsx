import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setMyFormats } from "@/lib/account.functions";
import { FORMAT_OPTIONS } from "@/lib/profile-options";

export function FormatsCard({ formats }: { formats: string[] }) {
  const queryClient = useQueryClient();
  const save = useServerFn(setMyFormats);
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
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
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
    <section className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold">Formatos de trabalho</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent">
            Editar
          </DialogTrigger>
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
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100"
              >
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {formats.length ? (
          formats.map((format) => (
            <span
              key={format}
              className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {format}
            </span>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum formato selecionado.</p>
        )}
      </div>
    </section>
  );
}
