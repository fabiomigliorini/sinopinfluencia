import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProfileBySlug } from "@/lib/profiles.functions";
import { ProfileView } from "@/components/ProfileView";
import type { Database } from "@/integrations/supabase/types";

const SITE_URL = "https://sinopinfluencia.lovable.app";

const profileQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["profile", slug],
    queryFn: () => getProfileBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(profileQueryOptions(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Perfil indisponível — Sinop Influencia" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { profile } = loaderData;
    const title = `${profile.display_name} — Criador de conteúdo em ${profile.city ?? "Sinop, MT"}`;
    const description =
      profile.bio ??
      `Perfil de ${profile.display_name}, criador de conteúdo certificado pela ACES em Sinop.`;
    const image = profile.avatar_url
      ? profile.avatar_url.startsWith("http")
        ? profile.avatar_url
        : `${SITE_URL}${profile.avatar_url}`
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/${profile.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.display_name,
            description,
            ...(image ? { image } : {}),
            jobTitle: profile.niche ?? "Criador de conteúdo",
            url: `${SITE_URL}/${profile.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: profile.city ?? "Sinop, MT",
              addressCountry: "BR",
            },
          }),
        },
      ],
    };
  },
  component: ProfilePage,
  notFoundComponent: ProfileUnavailable,
  errorComponent: ProfileUnavailable,
});

function ProfileUnavailable() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Perfil indisponível</h1>
      <p className="text-muted-foreground">
        Este perfil não existe ou ainda não foi aprovado pela curadoria da ACES.
        Perfis em rascunho ou em análise só aparecem no painel do criador.
      </p>
      <div className="flex gap-3">
        <Link
          to="/diretorio"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Ver diretório
        </Link>
        <Link
          to="/dashboard"
          className="rounded-md border px-4 py-2"
        >
          Meu painel
        </Link>
      </div>
    </div>
  );
}


function ProfilePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(profileQueryOptions(slug));
  return <ProfileView data={data} />;
}
