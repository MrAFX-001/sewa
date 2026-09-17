import { createFileRoute } from "@tanstack/react-router";
import { ProblemStatementsPage } from "../components/ProblemStatementsPage";

export const Route = createFileRoute("/problem-statements")({
  head: () => ({
    meta: [
      { title: "Problem Statements | SEWA 2026" },
      {
        name: "description",
        content:
          "Explore the SEWA 2026 problem statements across Theme 1 (National Level Innovation) and Theme 2 (Local Community Level Innovations) at Delhi Technological University.",
      },
      { property: "og:title", content: "Problem Statements | SEWA 2026" },
      {
        property: "og:description",
        content:
          "National and local community problem statement categories for the SEWA FIRST Rashtriya Youth Innovation Challenge 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProblemStatementsPage,
});


