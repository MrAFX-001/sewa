import { createFileRoute } from "@tanstack/react-router";
import { EventRegisterPage } from "../components/EventRegisterPage";

export const Route = createFileRoute("/event-register")({
  head: () => ({
    meta: [
      { title: "Event Registration Dossier | SEVA 2026" },
      {
        name: "description",
        content:
          "Register directly for SEVA 2026 DTU Rashtriya Youth Innovation Challenge. Complete your event dossier, select your challenge theme, and register your team.",
      },
      { property: "og:title", content: "Event Registration Dossier | SEVA 2026" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EventRegisterPage,
});
