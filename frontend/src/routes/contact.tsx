import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "../components/SewaSite";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | SEWA 2026" },
      {
        name: "description",
        content:
          "Contact the SEWA 2026 Northern Region Coordinator at Delhi Technological University. Submit enquiries, technical support requests, or grievance descriptions.",
      },
      { property: "og:title", content: "Contact Us | SEWA 2026" },
      {
        property: "og:description",
        content:
          "Contact SEWA 2026 at Delhi Technological University for enquiries and support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});
