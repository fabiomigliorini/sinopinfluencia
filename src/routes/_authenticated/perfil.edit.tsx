import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getMyProfile,
  updateMyProfile,
  submitMyProfile,
  type ProfileInput,
} from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/perfil/edit")({
  component: EditProfilePage,
  head: () => ({
    meta: [
      { title: "Editar meu perfil — Sinop Influencia" },
      {
        name: "description",
        content:
          "Atualize bio, nicho, métricas, formatos de trabalho, portfólio e marcas do seu perfil de criador em Sinop.",
      },
      { property: "og:title", content: "Editar meu perfil — Sinop Influencia" },
      {
        property: "og:description",
        content: "Atualize as informações do seu perfil de criador na vitrine Sinop Influencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const NETWORKS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X / Twitter" },
  { value: "kwai", label: "Kwai" },
  { value: "linkedin", label: "LinkedIn" },
] as const;

const FORMAT_OPTIONS = [
  "Reels",
  "Stories",
  "TikTok",
  "UGC",
  "Vídeo longo",
  "Presença em evento",
  "Review de produto",
  "Live",
  "Fotografia",
  "Blog / texto",
];

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary";
const labelCls = "text-xs font-bold uppercase tracking-widest text-muted-foreground";

type MetricRow = { network: string; followers: string; audience_pct: string };
type WorkRow = { title: string; description: string; image_url: string };

function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const submit = useServerFn(submitMyProfile);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const [form, setForm] = useState({
    display_name: "",
    full_name: "",
    niche: "",
    city: "Sinop, MT",
    bio: "",
    main_network: "",
    whatsapp: "",
    avatar_url: "",
  });
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [brands, setBrands] = useState<string>("");
  const [works, setWorks] = useState<WorkRow[]>([]);

  useEffect(() => {
    if (!data?.profile) return;
    const p = data.profile;
    setForm({
      display_name: p.display_name ?? "",
      full_name: p.full_name ?? "",
      niche: p.niche ?? "",
      city: p.city ?? "Sinop, MT",
      bio: p.bio ?? "",
      main_network: p.main_network ?? "",
      whatsapp: p.whatsapp ?? "",
      avatar_url: p.avatar_url ?? "",
    });
    setMetrics(
      data.metrics.map((m) => ({
        network: m.network,
        followers: m.followers ?? "",
        audience_pct: m.audience_pct != null ? String(m.audience_pct) : "",
      })),
    );
    setFormats(data.formats.map((f) => f.format));
    setBrands(data.brands.map((b) => b.brand_name).join(", "));
    setWorks(
      data.works.map((w) => ({
        title: w.title,
        description: w.description ?? "",
        image_url: w.image_url ?? "",
      })),
    );
  }, [data]);

  function buildPayload(): ProfileInput {
    return {
      display_name: form.display_name.trim(),
      full_name: form.full_name.trim() || null,
      niche: form.niche.trim() || null,
      city: form.city.trim() || null,
      bio: form.bio.trim() || null,
      main_network: (form.main_network || null) as ProfileInput["main_network"],
      whatsapp: form.whatsapp.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      metrics: metrics
        .filter((m) => m.network)
        .map((m) => ({
          network: m.network as NonNullable<ProfileInput["main_network"]>,
          followers: m.followers.trim() || null,
          audience_pct: m.audience_pct ? Number(m.audience_pct) : null,
        })),
      formats,
      brands: brands
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      works: works
        .filter((w) => w.title.trim())
        .map((w) => ({
          title: w.title.trim(),
          description: w.description.trim() || null,
          image_url: w.image_url.trim() || null,
        })),
    };
  }

  const saveMutation = useMutation({
    mutationFn: () => save({ data: buildPayload() }),
    onSuccess: () => {
      toast.success("Perfil salvo");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await save({ data: buildPayload() });
      await submit();
    },
    onSuccess: () => {
      toast.success("Perfil enviado para a curadoria da ACES");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <div className="h-72 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 lg:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Editar meu perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quanto mais completo, maior a chance de ser aprovado pela curadoria.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent"
        >
          Voltar
        </Link>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Informações básicas</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelCls}>Nome público *</span>
              <input
                className={field}
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Nome completo</span>
              <input
                className={field}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Nicho</span>
              <input
                className={field}
                placeholder="Ex.: Gastronomia, Moda, Agro"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Cidade</span>
              <input
                className={field}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelCls}>Rede principal</span>
              <select
                className={field}
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
                className={field}
                placeholder="66 99999-9999"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className={labelCls}>URL da foto de perfil</span>
              <input
                className={field}
                placeholder="https://..."
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className={labelCls}>Bio</span>
              <textarea
                className={`${field} min-h-[120px] resize-y`}
                maxLength={1200}
                placeholder="Conte como você trabalha, seu público e o que entrega para as marcas."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Métricas por rede</h2>
            <button
              type="button"
              onClick={() =>
                setMetrics([...metrics, { network: "instagram", followers: "", audience_pct: "" }])
              }
              className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
            >
              Adicionar rede
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma rede adicionada.</p>
            )}
            {metrics.map((m, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <select
                  className={field}
                  value={m.network}
                  onChange={(e) => {
                    const next = [...metrics];
                    next[i] = { ...m, network: e.target.value };
                    setMetrics(next);
                  }}
                >
                  {NETWORKS.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <input
                  className={field}
                  placeholder="Seguidores (ex.: 18,4 mil)"
                  value={m.followers}
                  onChange={(e) => {
                    const next = [...metrics];
                    next[i] = { ...m, followers: e.target.value };
                    setMetrics(next);
                  }}
                />
                <input
                  className={field}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="% público local"
                  value={m.audience_pct}
                  onChange={(e) => {
                    const next = [...metrics];
                    next[i] = { ...m, audience_pct: e.target.value };
                    setMetrics(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMetrics(metrics.filter((_, idx) => idx !== i))}
                  className="rounded-2xl border border-border px-4 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Formatos de trabalho</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((option) => {
              const active = formats.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setFormats(
                      active ? formats.filter((f) => f !== option) : [...formats, option],
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Marcas com quem já trabalhou</h2>
          <label className="mt-4 block space-y-1.5">
            <span className={labelCls}>Separe por vírgula</span>
            <input
              className={field}
              placeholder="Padaria Central, Loja X, Concessionária Y"
              value={brands}
              onChange={(e) => setBrands(e.target.value)}
            />
          </label>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Portfólio</h2>
            <button
              type="button"
              onClick={() => setWorks([...works, { title: "", description: "", image_url: "" }])}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-accent"
            >
              Adicionar trabalho
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {works.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum trabalho cadastrado.</p>
            )}
            {works.map((w, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className={field}
                    placeholder="Título do trabalho"
                    value={w.title}
                    onChange={(e) => {
                      const next = [...works];
                      next[i] = { ...w, title: e.target.value };
                      setWorks(next);
                    }}
                  />
                  <input
                    className={field}
                    placeholder="URL da imagem"
                    value={w.image_url}
                    onChange={(e) => {
                      const next = [...works];
                      next[i] = { ...w, image_url: e.target.value };
                      setWorks(next);
                    }}
                  />
                </div>
                <textarea
                  className={`${field} mt-3 min-h-[80px] resize-y`}
                  placeholder="Descrição rápida do resultado"
                  value={w.description}
                  onChange={(e) => {
                    const next = [...works];
                    next[i] = { ...w, description: e.target.value };
                    setWorks(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setWorks(works.filter((_, idx) => idx !== i))}
                  className="mt-3 text-xs font-bold text-destructive"
                >
                  Remover trabalho
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition hover:bg-accent disabled:opacity-60"
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            type="button"
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {sendMutation.isPending ? "Enviando..." : "Salvar e enviar para curadoria"}
          </button>
        </div>
      </form>
    </div>
  );
}
