import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../components/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Portal Dashboard | SEWA 2026" },
      {
        name: "description",
        content: "Role-based administrative and applicant portal dashboard for SEWA 2026.",
      },
      { property: "og:title", content: "Portal Dashboard | SEWA 2026" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});
