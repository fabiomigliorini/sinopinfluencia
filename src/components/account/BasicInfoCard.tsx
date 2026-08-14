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
import { updateMyBasics, type BasicsInput } from "@/lib/account.functions";
import { NETWORKS, fieldCls, labelCls, networkLabel } from "@/lib/profile-options";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const emptyForm = {
  display_name: "",
  full_name: "",
  niche: "",
  city: "Sinop, MT",
  bio: "",
  main_network: "",
  whatsapp: "",
  email: "",
};

export function BasicInfoCard({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateMyBasics);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      display_name: profile.display_name ?? "",
      full_name: profile.full_name ?? "",
      niche: profile.niche ?? "",
      city: profile.city ?? "Sinop, MT",
      bio: profile.bio ?? "",
      main_network: profile.main_network ?? "",
      whatsapp: profile.whatsapp ?? "",
      email: profile.email ?? "",
    });
  }, [profile, open]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          display_name: form.display_name.trim(),
          full_name: form.full_name.trim() || null,
          niche: form.niche.trim() || null,
          city: form.city.trim() || null,
          bio: form.bio.trim() || null,
          main_network: (form.main_network || null) as BasicsInput["main_network"],
          whatsapp: form.whatsapp.trim() || null,
          email: form.email.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Informações salvas");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows: Array<[string, string]> = [
    ["Nome público", profile.display_name || "—"],
    ["Nome completo", profile.full_name || "—"],
    ["Nicho", profile.niche || "—"],
    ["Cidade", profile.city || "—"],
    ["Rede principal", networkLabel(profile.main_network) ?? "—"],
    ["WhatsApp", profile.whatsapp || "—"],
    ["E-mail de contato", profile.email || "—"],
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold">Informações básicas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent">
            Editar
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
              <label className="space-y-1.5">
                <span className={labelCls}>Nicho</span>
                <input
                  className={fieldCls}
                  placeholder="Ex.: Gastronomia, Moda, Agro"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                />
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
                <input
                  className={fieldCls}
                  placeholder="66 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
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
                <span className={labelCls}>Bio</span>
                <textarea
                  className={`${fieldCls} min-h-[120px] resize-y`}
                  maxLength={1200}
                  placeholder="Conte como você trabalha, seu público e o que entrega para as marcas."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
              <DialogFooter className="md:col-span-2">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {mutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className={labelCls}>{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
        <div className="sm:col-span-2">
          <dt className={labelCls}>Bio</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground/80">
            {profile.bio || "Você ainda não escreveu sua bio."}
          </dd>
        </div>
      </dl>
    </section>
  );
}
