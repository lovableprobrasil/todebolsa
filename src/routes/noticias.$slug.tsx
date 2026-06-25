import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/noticias/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/guia/$slug", params: { slug: params.slug } });
  },
});
