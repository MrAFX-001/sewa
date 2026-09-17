import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../components/SewaSite";
export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In | SEVA 2026" },
      { name: "description", content: "Sign in to the SEVA 2026 innovation challenge portal." },
      { property: "og:title", content: "Sign In | SEVA 2026" },
      {
        property: "og:description",
        content: "Access your SEVA challenge workspace and submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthPage mode="login" />,
});
