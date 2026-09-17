import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const publicRouter = Router();

/**
 * Public aggregate statistics only. No identities, emails, contact details,
 * audit logs, or individual registrations are exposed here.
 */
publicRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [entries, shortlisted, participants, teams] = await Promise.all([
      prisma.team.count({ where: { status: { not: "draft" } } }),
      prisma.team.count({ where: { status: "shortlisted" } }),
      prisma.teamMember.count(),
      prisma.team.findMany({
        where: { status: { not: "draft" } },
        select: {
          status: true,
          participantCategory: true,
          affiliationState: true,
          mentorName: true,
        },
      }),
    ]);

    const states = [
      { state: "Delhi" },
      { state: "Haryana", note: "(without Chandigarh)" },
      { state: "Punjab", note: "(without Chandigarh)" },
      { state: "Chandigarh" },
      { state: "Himachal Pradesh" },
      { state: "Uttarakhand" },
      { state: "Ladakh" },
      { state: "Jammu & Kashmir" },
      { state: "Uttar Pradesh" },
    ];

    const normalizeState = (value: string | null): string => {
      switch (value) {
        case "J&K": return "Jammu & Kashmir";
        case "HP": return "Himachal Pradesh";
        case "UP": return "Uttar Pradesh";
        default: return value ?? "";
      }
    };

    const emptyRows = () => states.map((s) => ({
      ...s,
      schools: 0,
      colleges: 0,
      industries: 0,
    }));

    const buildBreakdown = (predicate: (team: (typeof teams)[number]) => boolean) => {
      const rows = emptyRows();
      const rowByState = new Map(rows.map((row) => [row.state, row]));
      for (const team of teams) {
        if (!predicate(team)) continue;
        const row = rowByState.get(normalizeState(team.affiliationState));
        if (!row) continue;
        if (team.participantCategory === "School & Vocational") row.schools += 1;
        else if (team.participantCategory === "Diploma & Higher Education") row.colleges += 1;
        else if (team.participantCategory === "Industry & Government") row.industries += 1;
      }
      return rows;
    };

    res.status(200).json({
      entries,
      shortlisted,
      participants,
      mentored: teams.filter((team) => Boolean(team.mentorName)).length,
      prototypes: 0,
      tested: 0,
      validated: 0,
      breakdowns: {
        entries: buildBreakdown(() => true),
        shortlisted: buildBreakdown((team) => team.status === "shortlisted"),
        mentored: buildBreakdown((team) => Boolean(team.mentorName)),
        prototypes: buildBreakdown(() => false),
        tested: buildBreakdown(() => false),
        validated: buildBreakdown(() => false),
      },
    });
  }),
);
