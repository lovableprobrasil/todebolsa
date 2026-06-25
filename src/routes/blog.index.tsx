import { redirect, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/")({
  beforeLoad: () => {
    throw redirect({ to: "/guia" });
  },
});