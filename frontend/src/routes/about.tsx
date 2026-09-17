import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../components/SewaSite";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SEVA 2026 | Vision, Mission & Philosophy" },
      {
        name: "description",
        content:
          "Explore the Vision, Mission, Philosophy, Aim, Objectives, Unique Features, and Purpose & Benefits of SEVA FIRST – Rashtriya Youth Innovation Challenge 2026 at Delhi Technological University.",
      },
      { property: "og:title", content: "About SEVA 2026 | Vision, Mission & Philosophy" },
      {
        property: "og:description",
        content:
          "Transform real-world problems into practical innovations contributing to Viksit Bharat through the SEVA FIRST innovation pathway.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});
