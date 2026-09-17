import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sortAnnouncementsNewestFirst } from "../utils/announcements.js";

export async function listAnnouncements(_req: Request, res: Response) {
  const announcements = await prisma.announcement.findMany({
    select: {
      id: true,
      refNumber: true,
      category: true,
      title: true,
      summary: true,
      detail: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  sortAnnouncementsNewestFirst(announcements);

  res.json(announcements);
}

