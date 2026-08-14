import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy address: profiles used to live at /<slug>, now they live at /perfil/<slug>. */
export const Route = createFileRoute("/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/perfil/$slug",
      params: { slug: params.slug },
      replace: true,
    });
  },
});
