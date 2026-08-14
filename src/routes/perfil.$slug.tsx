import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy address: profiles used to live at /perfil/<slug>, now they live at /criador/<slug>. */
export const Route = createFileRoute("/perfil/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/criador/$slug",
      params: { slug: params.slug },
      replace: true,
    });
  },
});
