import { createFileRoute } from "@tanstack/react-router";
import { TeamRegisterPage } from "../components/TeamRegisterPage";
import { RequireAuth } from "../lib/auth";

export const Route = createFileRoute("/team-register")({
  head: () => ({
    meta: [
      { title: "Register Team | SEWA 2026" },
      { name: "description", content: "Register your team for SEWA 2026." },
      { property: "og:title", content: "Register Team | SEWA 2026" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TeamRegisterPage />
    </RequireAuth>
  ),
});
