import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "../components/SewaSite";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password | SEWA 2026" },
      { name: "description", content: "Reset your SEWA 2026 account password." },
      { property: "og:title", content: "Forgot Password | SEWA 2026" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => <ForgotPasswordPage />,
});
