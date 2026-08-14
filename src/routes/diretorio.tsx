import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { directoryQueryOptions, metadataQueryOptions } from "@/lib/profile-queries";
import { buildFormatsMap, buildMetricsMap } from "@/lib/directory-maps";

import { ProfileCard } from "@/components/ProfileCard";
import { TierBadge } from "@/components/ProfileCard";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type MetricRow = Database["public"]["Tables"]["profile_metrics"]["Row"];

const searchSchema = z.object({
  q: z.string().optional(),
  niche: z.string().optional(),
  network: z.string().optional(),
  tier: z.string().optional(),
});

export const Route = createFileRoute("/diretorio")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(metadataQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Diretório de criadores — Sinop Influencia" },
      {
        name: "description",
        content:
          "Navegue pelos perfis certificados da Vitrine Sinop Influencia. Filtre por nicho, categoria, rede principal e nível de criador.",
      },
      {
        property: "og:title",
        content: "Diretório de criadores — Sinop Influencia",
      },
      {
        property: "og:description",
        content:
          "Navegue pelos perfis certificados da Vitrine Sinop Influencia. Filtre por nicho, categoria, rede principal e nível de criador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: profiles } = useSuspenseQuery(directoryQueryOptions(search));
  const { data: metadata } = useSuspenseQuery(metadataQueryOptions);

  const metricsMap = buildMetricsMap(metadata?.metrics ?? []);
  const formatsMap = buildFormatsMap(metadata?.formats ?? []);


  const update = (
    key: "q" | "niche" | "network" | "tier",
    value: string,
  ) => {
    navigate({ search: (prev) => ({ ...prev, [key]: value || undefined }) });
  };

  const networks = [
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "YouTube" },
    { value: "kwai", label: "Kwai" },
    { value: "facebook", label: "Facebook" },
    { value: "linkedin", label: "LinkedIn" },
  ];

  const tiers = [
    { value: "creator", label: "Criador (1 estrela)" },
    { value: "reference", label: "Referência (2 estrelas)" },
    { value: "icon", label: "Ícone (3 estrelas)" },
    { value: "featured", label: "Destaque (4 estrelas)" },
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-primary">
              Diretório
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
              Criadores certificados
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metadata?.count ?? 0} perfis verificados pela ACES
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-bold text-primary hover:underline"
          >
            ← Voltar para home
          </Link>
        </div>

        <div className="mt-8 rounded-[22px] border border-border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <div className="flex flex-col gap-1.5">
              <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Buscar
              </label>
              <input
                type="text"
                value={search.q}
                onChange={(e) => update("q", e.target.value)}
                placeholder="Nome, nicho, palavra-chave..."
                className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Categoria
              </label>
              <select
                value={search.niche}
                onChange={(e) => update("niche", e.target.value)}
                className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Todas</option>
                {(metadata?.niches ?? []).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Rede
              </label>
              <select
                value={search.network}
                onChange={(e) => update("network", e.target.value)}
                className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Todas</option>
                {networks.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="pl-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Nível
              </label>
              <select
                value={search.tier}
                onChange={(e) => update("tier", e.target.value)}
                className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Todos</option>
                {tiers.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={() =>
                  navigate({ search: { q: "", niche: "", network: "", tier: "" } })
                }
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {profiles.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile, index) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                metrics={[
                  metricsMap[profile.id as string] as MetricRow,
                ].filter(Boolean)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              Nenhum criador encontrado com os filtros selecionados.
            </p>
            <button
              onClick={() =>
                navigate({ search: { q: "", niche: "", network: "", tier: "" } })
              }
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
