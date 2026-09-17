import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../components/SewaSite";
export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Register Your Team | SEVA 2026" },
      {
        name: "description",
        content: "Register your team for the SEVA 2026 Youth Innovation Challenge.",
      },
      { property: "og:title", content: "Register Your Team | SEVA 2026" },
      {
        property: "og:description",
        content: "Begin your team's innovation journey with DTU.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthPage mode="register" />,
});
