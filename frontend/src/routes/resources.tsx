import { createFileRoute } from "@tanstack/react-router";
import { AdditionalResourcesPage } from "../components/AdditionalResourcesPage";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Additional Resources | SEVA 2026" },
      {
        name: "description",
        content:
          "Reference documents and external links for SEVA 2026 participants at Delhi Technological University.",
      },
      { property: "og:title", content: "Additional Resources | SEVA 2026" },
      {
        property: "og:description",
        content: "Reference documents and external links for SEVA 2026 participants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdditionalResourcesPage,
});
