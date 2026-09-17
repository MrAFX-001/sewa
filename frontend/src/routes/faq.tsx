import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "../components/SewaSite";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions | SEWA 2026" },
      {
        name: "description",
        content:
          "Everything you need to know about participating in SEWA 2026, campus visits, support, and evaluation criteria at Delhi Technological University.",
      },
      { property: "og:title", content: "Frequently Asked Questions | SEWA 2026" },
      {
        property: "og:description",
        content:
          "Frequently asked questions about SEWA 2026 eligibility, campus visits, accommodations, and evaluation criteria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});
