import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../components/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Portal Dashboard | SEVA 2026" },
      {
        name: "description",
        content: "Role-based administrative and applicant portal dashboard for SEVA 2026.",
      },
      { property: "og:title", content: "Portal Dashboard | SEVA 2026" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});
