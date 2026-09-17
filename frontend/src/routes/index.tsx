import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../components/SewaSite";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEWA 2026 | DTU Innovation Challenge" },
      {
        name: "description",
        content:
          "Join SEWA 2026, DTU's 100-day national innovation challenge for students, researchers and startups.",
      },
      { property: "og:title", content: "SEWA 2026 | DTU Innovation Challenge" },
      {
        property: "og:description",
        content: "Observe, innovate, impact through a 100-day national challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
