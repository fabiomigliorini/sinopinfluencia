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
import { addMyBrand, removeMyBrand } from "@/lib/account.functions";
import { fieldCls, labelCls } from "@/lib/profile-options";

type Brand = { id: string; brand_name: string };

export function BrandsCard({ brands }: { brands: Brand[] }) {
  const queryClient = useQueryClient();
  const add = useServerFn(addMyBrand);
  const remove = useServerFn(removeMyBrand);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });

  const addMutation = useMutation({
    mutationFn: () => add({ data: { brandName: name.trim() } }),
    onSuccess: () => {
      toast.success("Marca adicionada");
      setName("");
      setOpen(false);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (brandId: string) => remove({ data: { brandId } }),
    onSuccess: () => {
      toast.success("Marca removida");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold">Marcas com quem já trabalhou</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent">
            Adicionar marca
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Adicionar marca</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                addMutation.mutate();
              }}
            >
              <label className="space-y-1.5 block">
                <span className={labelCls}>Nome da marca</span>
                <input
                  className={fieldCls}
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: MG Papelaria"
                />
              </label>
              <DialogFooter>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {addMutation.isPending ? "Adicionando..." : "Adicionar"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {brands.length ? (
          brands.map((brand) => (
            <span
              key={brand.id}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {brand.brand_name}
              <button
                type="button"
                aria-label={`Remover ${brand.brand_name}`}
                onClick={() => removeMutation.mutate(brand.id)}
                disabled={removeMutation.isPending}
                className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma marca cadastrada.</p>
        )}
      </div>
    </section>
  );
}
