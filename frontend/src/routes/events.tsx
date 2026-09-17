import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "../components/SewaSite";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Timeline | SEWA 2026" },
      {
        name: "description",
        content:
          "Discover the 100-Day Innovation Journey, National Launch Event, and 6 stages of the SEWA 2026 challenge at DTU.",
      },
      { property: "og:title", content: "Events & Timeline | SEWA 2026" },
      {
        property: "og:description",
        content:
          "Discover key events and the 6-stage roadmap for SEWA 2026 at Delhi Technological University.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});
