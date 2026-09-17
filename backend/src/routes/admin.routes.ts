import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../lib/audit.js";
import { sendAdminBroadcastEmail } from "../utils/mailer.js";
import {
  getNextAnnouncementId,
  sortAnnouncementsNewestFirst,
} from "../utils/announcements.js";

export const adminRouter = Router();
export const resourceRouter = Router();

const resourceUploadDir = path.resolve("uploads/resources");
mkdirSync(resourceUploadDir, { recursive: true });

const resourceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resourceUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext || ".png"}`);
  },
});

const uploadResourceImage = multer({
  storage: resourceStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WebP, GIF, SVG) are allowed"));
    }
  },
});


// ─── Super Admin & Admin Overview Statistics ─────────────────────────────────

adminRouter.get(
  "/stats",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      totalTeams,
      totalQueries,
      pendingSubmissions,
      shortlistedTeams,
      teamsByStatus,
      teamsByTheme,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.contactMessage.count(),
      prisma.team.count({
        where: {
          status: { in: ["submitted", "under_review"] },
        },
      }),
      prisma.team.count({
        where: { status: "shortlisted" },
      }),
      prisma.team.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.team.groupBy({
        by: ["theme"],
        _count: { id: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Top institutions from real teams
    const teams = await prisma.team.findMany({
      select: {
        institute: true,
        institutionAddress: true,
        status: true,
        members: { select: { id: true } },
      },
    });

    const instituteMap = new Map<string, { college: string; location: string; count: number; participants: number; status: string }>();
    for (const t of teams) {
      const instName = t.institute || "General Registrations";
      const existing = instituteMap.get(instName) || {
        college: instName,
        location: t.institutionAddress || "Delhi, India",
        count: 0,
        participants: 0,
        status: t.status === "shortlisted" ? "Delivered" : t.status === "rejected" ? "Rejected" : "Pending",
      };
      existing.count += 1;
      existing.participants += 1 + (t.members?.length || 0);
      instituteMap.set(instName, existing);
    }

    const analyticsRows = Array.from(instituteMap.values()).map((v, idx) => ({
      id: String(idx + 1),
      college: v.college,
      location: v.location,
      usersRegistered: v.participants,
      state: "Delhi",
      participants: v.participants,
      status: v.status as "Delivered" | "Pending" | "Rejected",
    }));

    // Real multi-metric traffic and registration velocity by month
    const [allUsers, allTeams, allQueries] = await Promise.all([
      prisma.user.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
      prisma.team.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
      prisma.contactMessage.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months: {
      label: string;
      fullLabel: string;
      users: number;
      teams: number;
      queries: number;
      cumulativeUsers: number;
      cumulativeTeams: number;
      cumulativeQueries: number;
    }[] = [];

    let cumUsers = 0;
    let cumTeams = 0;
    let cumQueries = 0;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();

      const usersCount = allUsers.filter((u) => {
        const uDate = new Date(u.createdAt);
        return uDate.getMonth() === mIdx && uDate.getFullYear() === y;
      }).length;

      const teamsCount = allTeams.filter((t) => {
        const tDate = new Date(t.createdAt);
        return tDate.getMonth() === mIdx && tDate.getFullYear() === y;
      }).length;

      const queriesCount = allQueries.filter((q) => {
        const qDate = new Date(q.createdAt);
        return qDate.getMonth() === mIdx && qDate.getFullYear() === y;
      }).length;

      cumUsers += usersCount;
      cumTeams += teamsCount;
      cumQueries += queriesCount;

      last6Months.push({
        label: monthNames[mIdx] ?? "Mon",
        fullLabel: `${monthNames[mIdx]} ${y}`,
        users: usersCount,
        teams: teamsCount,
        queries: queriesCount,
        cumulativeUsers: cumUsers,
        cumulativeTeams: cumTeams,
        cumulativeQueries: cumQueries,
      });
    }

    const peakVal = Math.max(...last6Months.map((m) => m.users), totalUsers || 1);
    const trafficData = {
      labels: last6Months.map((m) => m.label),
      fullLabels: last6Months.map((m) => m.fullLabel),
      counts: last6Months.map((m) => m.users),
      userCounts: last6Months.map((m) => m.users),
      teamCounts: last6Months.map((m) => m.teams),
      queryCounts: last6Months.map((m) => m.queries),
      cumulativeUserCounts: last6Months.map((m) => m.cumulativeUsers),
      cumulativeTeamCounts: last6Months.map((m) => m.cumulativeTeams),
      cumulativeQueryCounts: last6Months.map((m) => m.cumulativeQueries),
      peak: peakVal,
      peakLabel: `${peakVal} ${peakVal === 1 ? "User" : "Users"}`,
    };

    res.status(200).json({
      totalUsers,
      totalTeams,
      totalQueries,
      pendingSubmissions,
      shortlistedTeams,
      statusBreakdown: teamsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      themeDistribution: teamsByTheme.map((t) => ({ theme: t.theme || "Unassigned", count: t._count.id })),
      analyticsRows,
      recentUsers,
      trafficData,
    });
  }),
);

// ─── Super Admin User Management Routes ──────────────────────────────────────

adminRouter.get(
  "/users",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            ledTeams: true,
            teamMemberships: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phone || "—",
      role: u.role,
      status: u.status === "active" ? "Active" : u.status === "suspended" ? "Suspended" : "Pending",
      joinedDate: u.createdAt.toISOString().split("T")[0],
      teamsCount: u._count.ledTeams + u._count.teamMemberships,
    }));

    res.status(200).json({ users: formatted });
  }),
);

adminRouter.post(
  "/users/invite",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, role, phone } = req.body;

    if (!firstName || !email || !role) {
      return res.status(400).json({ error: "First name, email, and role are required." });
    }

    if (!["SUPER_ADMIN", "ADMIN", "RESOURCE", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists." });
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName || "",
        email,
        phone: phone || null,
        role: role as any,
        status: "active",
        emailVerified: true,
        passwordHash: "$2b$10$e7K.08zYQoR7hGjVfNQq2.m7O0Lz2BqJqYvJq/2VzZqPqg4Q5K7hK",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      req,
      userId: req.user?.id,
      action: "user_invite",
      metadata: { targetUserId: newUser.id, targetEmail: newUser.email, assignedRole: role },
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        role: newUser.role,
        status: "Active",
        joinedDate: newUser.createdAt.toISOString().split("T")[0],
        teamsCount: 0,
      },
    });
  }),
);

adminRouter.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user?.id === id) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }

    if (!["SUPER_ADMIN", "ADMIN", "RESOURCE", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      req,
      userId: req.user?.id,
      action: "role_assign",
      metadata: { targetUserId: id, targetEmail: updatedUser.email, newRole: role },
    });

    res.status(200).json({ success: true, user: updatedUser });
  }),
);

adminRouter.patch(
  "/users/:id/status",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user?.id === id) {
      return res.status(400).json({ error: "You cannot change your own status." });
    }

    if (!["active", "suspended", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status specified." });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      req,
      userId: req.user?.id,
      action: "status_update",
      metadata: { targetUserId: id, targetEmail: updatedUser.email, newStatus: status },
    });

    res.status(200).json({ success: true, user: updatedUser });
  }),
);

// ─── Submissions & Evaluation Routes (Admin & Super Admin) ───────────────────

adminRouter.get(
  "/teams",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (_req, res) => {
    const teams = await prisma.team.findMany({
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        members: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = teams.map((t) => ({
      id: t.id,
      teamName: t.name,
      institution: t.institute,
      institutionAddress: t.institutionAddress,
      theme: t.theme,
      problemStatement: t.problemStatement,
      problemCategoryCode: t.problemCategoryCode,
      problemOptionType: t.problemOptionType,
      problemStatementId: t.problemStatementId,
      status: t.status,
      score: t.score ?? 0,
      evaluatorNotes: t.evaluatorNotes || "",
      evaluatedAt: t.evaluatedAt ? t.evaluatedAt.toISOString() : null,
      evaluatedBy: t.evaluatedBy || null,
      submittedAt: t.submittedAt ? t.submittedAt.toISOString() : t.createdAt.toISOString(),
      leader: {
        name: `${t.leader.firstName} ${t.leader.lastName}`.trim(),
        email: t.leader.email,
        phone: t.leader.phone,
      },
      members: t.members.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        role: m.role,
      })),
      idCardPath: t.idCardPath,
      idCardOriginalName: t.idCardOriginalName,
    }));

    res.status(200).json({ teams: formatted });
  }),
);

adminRouter.patch(
  "/teams/:id/status",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, score, evaluatorNotes } = req.body;

    const updateData: any = {};
    if (status) {
      if (!["draft", "submitted", "under_review", "shortlisted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value." });
      }
      updateData.status = status;
    }
    if (typeof score === "number") {
      updateData.score = Math.max(0, Math.min(100, score));
      updateData.evaluatedAt = new Date();
      updateData.evaluatedBy = req.user?.id;
    }
    if (typeof evaluatorNotes === "string") {
      updateData.evaluatorNotes = evaluatorNotes;
      updateData.evaluatedAt = new Date();
      updateData.evaluatedBy = req.user?.id;
    }

    const updated = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        leader: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await writeAuditLog({
      req,
      userId: req.user?.id,
      action: "team_evaluate",
      metadata: { teamId: id, teamName: updated.name, newStatus: status, score },
    });

    res.status(200).json({ success: true, team: updated });
  }),
);

// ─── Broadcast & Admin Mail Routes ───────────────────────────────────────────

adminRouter.get(
  "/mail",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (_req, res) => {
    const [mails, queries] = await Promise.all([
      prisma.adminMail.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedMails = mails.map((m) => ({
      id: m.id,
      sender: m.sender ? `${m.sender.firstName} ${m.sender.lastName}`.trim() : "SEWA Secretariat",
      email: m.sender?.email || "sewa2026@dtu.ac.in",
      title: m.subject,
      snippet: m.content.slice(0, 90) + (m.content.length > 90 ? "..." : ""),
      body: m.content,
      time: m.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      tag: m.targetAudience === "ALL" ? "Primary" : m.targetAudience === "MEMBER" ? "Work" : "Important",
      starred: m.starred,
      archived: m.archived,
      folder: m.folder || "Sent",
      targetAudience: m.targetAudience,
      isQuery: false,
    }));

    const formattedQueries = queries.map((q) => ({
      id: q.id,
      sender: q.fullName,
      email: q.email,
      title: `[Query: ${q.category}] ${q.subject}`,
      snippet: q.message.slice(0, 90) + (q.message.length > 90 ? "..." : ""),
      body: `Phone: ${q.phone}\nTeam/Affiliation: ${q.teamOrAffiliationId || "N/A"}\n\nMessage:\n${q.message}`,
      time: q.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      tag: "Primary",
      starred: false,
      archived: q.status === "resolved",
      folder: "Inbox",
      targetAudience: "ADMIN",
      isQuery: true,
    }));

    res.status(200).json({ mails: [...formattedQueries, ...formattedMails] });
  }),
);

adminRouter.post(
  "/mail",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { targetAudience, targetEmail, subject, content, folder } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: "Subject and content are required." });
    }

    // Resolve recipient emails based on targetAudience
    let recipientEmails: string[] = [];

    if (targetAudience === "DIRECT") {
      if (!targetEmail || !targetEmail.trim()) {
        return res.status(400).json({ error: "Direct email address is required for direct communications." });
      }
      recipientEmails = [targetEmail.trim()];
    } else if (targetAudience === "MEMBER") {
      const [members, teamMembers] = await Promise.all([
        prisma.user.findMany({
          where: { role: "MEMBER" },
          select: { email: true },
        }),
        prisma.teamMember.findMany({
          select: { email: true },
        }),
      ]);
      recipientEmails = [...members.map((u) => u.email), ...teamMembers.map((tm) => tm.email)];
    } else if (targetAudience === "ADMIN") {
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        select: { email: true },
      });
      recipientEmails = admins.map((u) => u.email);
    } else if (targetAudience === "RESOURCE") {
      const resources = await prisma.user.findMany({
        where: { role: "RESOURCE" },
        select: { email: true },
      });
      recipientEmails = resources.map((u) => u.email);
    } else {
      // Default: ALL registered users + team members
      const [users, teamMembers] = await Promise.all([
        prisma.user.findMany({ select: { email: true } }),
        prisma.teamMember.findMany({ select: { email: true } }),
      ]);
      recipientEmails = [...users.map((u) => u.email), ...teamMembers.map((tm) => tm.email)];
    }

    // Clean & deduplicate recipient emails
    recipientEmails = Array.from(
      new Set(recipientEmails.map((e) => e.trim().toLowerCase())),
    ).filter((e) => e.length > 0 && e.includes("@"));

    const senderUser = req.user
      ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { firstName: true, lastName: true, email: true },
      })
      : null;

    const senderName = senderUser
      ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() || "SEWA 2026 Admin"
      : "SEWA 2026 Organizing Committee";

    // 1. Dispatch real SMTP emails to all resolved recipients
    let delivery = { total: 0, sent: 0, failed: 0, errors: [] as string[] };
    if (recipientEmails.length > 0) {
      delivery = await sendAdminBroadcastEmail({
        recipients: recipientEmails,
        subject,
        content,
        senderName,
      });
    }

    // 2. Persist communication record in the database
    const mail = await prisma.adminMail.create({
      data: {
        senderId: req.user?.id,
        targetAudience: targetAudience || "ALL",
        targetEmail: targetEmail ? targetEmail.trim() : null,
        subject,
        content,
        folder: folder || "Sent",
      },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // 3. Write comprehensive audit log
    await writeAuditLog({
      req,
      userId: req.user?.id,
      action: "broadcast_mail",
      metadata: {
        mailId: mail.id,
        subject,
        targetAudience,
        targetEmail: targetEmail || null,
        totalRecipients: recipientEmails.length,
        delivered: delivery.sent,
        failed: delivery.failed,
      },
    });

    res.status(201).json({
      success: true,
      mail,
      delivery,
      message:
        delivery.sent > 0
          ? `Dispatched successfully to ${delivery.sent} recipient(s).`
          : recipientEmails.length === 0
            ? "Saved as broadcast draft; no recipient emails currently registered."
            : "Broadcast record saved, but delivery failed for some or all recipients.",
    });
  }),
);

adminRouter.patch(
  "/mail/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { starred, archived, folder } = req.body;

    const updated = await prisma.adminMail.update({
      where: { id },
      data: {
        ...(typeof starred === "boolean" ? { starred } : {}),
        ...(typeof archived === "boolean" ? { archived } : {}),
        ...(folder ? { folder } : {}),
      },
    });

    res.status(200).json({ success: true, mail: updated });
  }),
);

adminRouter.delete(
  "/mail/:id",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.adminMail.delete({ where: { id } });
    res.status(200).json({ success: true });
  }),
);

// ─── Super Admin Audit Log Routes ────────────────────────────────────────────

adminRouter.get(
  "/audit-logs",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const formatted = logs.map((l) => {
      const meta = (l.metadata as Record<string, any>) || {};
      const target =
        meta.target ||
        meta.targetEmail ||
        meta.teamName ||
        meta.name ||
        meta.title ||
        meta.label ||
        meta.code ||
        meta.filename ||
        (l.action.startsWith("committee_") ? "Committee" :
         l.action.startsWith("gallery_") ? "Gallery" :
         l.action.startsWith("theme_") ? "Theme" :
         l.action.startsWith("hero_slide_") ? "Hero Slide" :
         l.action.startsWith("faq_") ? "FAQ" :
         l.action.startsWith("announcement_") ? "Announcement" :
         l.action.startsWith("media_") ? "Media" : "Global Resource");

      return {
        id: l.id.toString(),
        actor: l.user ? `${l.user.firstName} ${l.user.lastName}` : "System",
        actorEmail: l.user?.email || "System",
        action: l.action,
        target,
        timestamp: l.createdAt.toISOString().replace("T", " ").slice(0, 19),
        metadata: meta,
      };
    });

    res.status(200).json({ logs: formatted });
  }),
);

// ─── Resource & Homepage Gallery Routes ──────────────────────────────────────

resourceRouter.get(
  "/homepage-gallery",
  asyncHandler(async (_req, res) => {
    const items = await prisma.galleryImage.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
    });
    res.status(200).json({ items });
  }),
);

resourceRouter.get(
  "/gallery",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (_req, res) => {
    const items = await prisma.galleryImage.findMany({
      orderBy: { displayOrder: "asc" },
    });
    res.status(200).json({ items });
  }),
);

resourceRouter.post(
  "/gallery",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { title, url, displayOrder } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required." });
    }

    const item = await prisma.galleryImage.create({
      data: {
        title,
        url,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        uploadedBy: req.user?.id,
        active: true,
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "gallery_image_create",
      metadata: {
        target: item.title,
        id: item.id,
        title: item.title,
        url: item.url,
        displayOrder: item.displayOrder,
      },
      req,
    });

    res.status(201).json({ item });
  }),
);

resourceRouter.patch(
  "/gallery/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { active, displayOrder, title } = req.body;

    const previous = await prisma.galleryImage.findUnique({ where: { id } });

    const item = await prisma.galleryImage.update({
      where: { id },
      data: {
        ...(typeof active === "boolean" ? { active } : {}),
        ...(typeof displayOrder === "number" ? { displayOrder } : {}),
        ...(title ? { title } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "gallery_image_update",
      metadata: {
        target: item.title || previous?.title || id,
        id,
        changes: {
          active: active !== undefined && active !== previous?.active ? { from: previous?.active, to: item.active } : undefined,
          displayOrder: displayOrder !== undefined && displayOrder !== previous?.displayOrder ? { from: previous?.displayOrder, to: item.displayOrder } : undefined,
          title: title !== undefined && title !== previous?.title ? { from: previous?.title, to: item.title } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ item });
  }),
);

resourceRouter.delete(
  "/gallery/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.galleryImage.findUnique({ where: { id } });
    await prisma.galleryImage.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "gallery_image_delete",
      metadata: {
        target: previous?.title || id,
        id,
        deletedTitle: previous?.title,
        deletedUrl: previous?.url,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

// ─── Committee Members Management Routes ─────────────────────────────────────

resourceRouter.get(
  "/committee",
  asyncHandler(async (_req, res) => {
    const members = await prisma.committeeMember.findMany({
      orderBy: [{ rowNumber: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    });
    res.status(200).json({ members });
  }),
);

resourceRouter.post(
  "/committee",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { name, designation, category, affiliation, imageUrl, displayOrder, rowNumber, rowTitle } = req.body;
    if (!name || !designation || !category) {
      return res.status(400).json({ error: "Name, designation, and category are required." });
    }

    const member = await prisma.committeeMember.create({
      data: {
        name,
        designation,
        category,
        affiliation: affiliation || null,
        imageUrl: imageUrl || null,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        rowNumber: typeof rowNumber === "number" ? rowNumber : 1,
        rowTitle: rowTitle || null,
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "committee_member_create",
      metadata: {
        target: member.name,
        id: member.id,
        name: member.name,
        designation: member.designation,
        category: member.category,
        displayOrder: member.displayOrder,
        rowNumber: member.rowNumber,
        rowTitle: member.rowTitle,
      },
      req,
    });

    res.status(201).json({ member });
  }),
);

resourceRouter.put(
  "/committee/layout",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "updates array is required." });
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.committeeMember.update({
          where: { id: u.id },
          data: {
            rowNumber: typeof u.rowNumber === "number" ? u.rowNumber : 1,
            displayOrder: typeof u.displayOrder === "number" ? u.displayOrder : 0,
            ...(u.rowTitle !== undefined ? { rowTitle: u.rowTitle || null } : {}),
          },
        }),
      ),
    );

    await writeAuditLog({
      userId: req.user?.id,
      action: "committee_layout_reorder",
      metadata: {
        target: `${updates.length} Committee Members`,
        count: updates.length,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

resourceRouter.patch(
  "/committee/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, designation, category, affiliation, imageUrl, displayOrder, rowNumber, rowTitle } = req.body;

    const previous = await prisma.committeeMember.findUnique({ where: { id } });

    const member = await prisma.committeeMember.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(designation ? { designation } : {}),
        ...(category ? { category } : {}),
        ...(affiliation !== undefined ? { affiliation } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(typeof displayOrder === "number" ? { displayOrder } : {}),
        ...(typeof rowNumber === "number" ? { rowNumber } : {}),
        ...(rowTitle !== undefined ? { rowTitle: rowTitle || null } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "committee_member_update",
      metadata: {
        target: member.name,
        id,
        changes: {
          name: name !== undefined && name !== previous?.name ? { from: previous?.name, to: member.name } : undefined,
          designation: designation !== undefined && designation !== previous?.designation ? { from: previous?.designation, to: member.designation } : undefined,
          category: category !== undefined && category !== previous?.category ? { from: previous?.category, to: member.category } : undefined,
          displayOrder: displayOrder !== undefined && displayOrder !== previous?.displayOrder ? { from: previous?.displayOrder, to: member.displayOrder } : undefined,
          rowNumber: rowNumber !== undefined && rowNumber !== previous?.rowNumber ? { from: previous?.rowNumber, to: member.rowNumber } : undefined,
          imageUrl: imageUrl !== undefined && imageUrl !== previous?.imageUrl ? { from: previous?.imageUrl, to: member.imageUrl } : undefined,
          affiliation: affiliation !== undefined && affiliation !== previous?.affiliation ? { from: previous?.affiliation, to: member.affiliation } : undefined,
          rowTitle: rowTitle !== undefined && rowTitle !== previous?.rowTitle ? { from: previous?.rowTitle, to: member.rowTitle } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ member });
  }),
);

resourceRouter.delete(
  "/committee/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.committeeMember.findUnique({ where: { id } });
    await prisma.committeeMember.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "committee_member_delete",
      metadata: {
        target: previous?.name || id,
        id,
        deletedName: previous?.name,
        deletedCategory: previous?.category,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

// ─── Image Upload Endpoint ───────────────────────────────────────────────────
resourceRouter.post(
  "/upload-image",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  uploadResourceImage.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }
    const relativeUrl = `/uploads/resources/${req.file.filename}`;

    await writeAuditLog({
      userId: req.user?.id,
      action: "media_upload",
      metadata: {
        target: req.file.originalname || req.file.filename,
        filename: req.file.filename,
        url: relativeUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      req,
    });

    res.status(200).json({ url: relativeUrl, filename: req.file.filename });
  }),
);

// ─── Hero Slides / Banners ───────────────────────────────────────────────────
resourceRouter.get(
  "/hero-slides",
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === "true";
    const slides = await prisma.heroSlide.findMany({
      where: showAll ? undefined : { active: true },
      orderBy: { displayOrder: "asc" },
    });
    res.status(200).json({ slides });
  }),
);

resourceRouter.post(
  "/hero-slides",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { title, subtitle, imageUrl, displayOrder, active } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ error: "Title and image URL are required." });
    }
    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        active: typeof active === "boolean" ? active : true,
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "hero_slide_create",
      metadata: {
        target: slide.title,
        id: slide.id,
        title: slide.title,
        imageUrl: slide.imageUrl,
        displayOrder: slide.displayOrder,
      },
      req,
    });

    res.status(201).json({ slide });
  }),
);

resourceRouter.patch(
  "/hero-slides/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, imageUrl, displayOrder, active } = req.body;
    const previous = await prisma.heroSlide.findUnique({ where: { id } });
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "hero_slide_update",
      metadata: {
        target: slide.title || previous?.title || id,
        id,
        changes: {
          title: title !== undefined && title !== previous?.title ? { from: previous?.title, to: slide.title } : undefined,
          subtitle: subtitle !== undefined && subtitle !== previous?.subtitle ? { from: previous?.subtitle, to: slide.subtitle } : undefined,
          imageUrl: imageUrl !== undefined && imageUrl !== previous?.imageUrl ? { from: previous?.imageUrl, to: slide.imageUrl } : undefined,
          displayOrder: displayOrder !== undefined && displayOrder !== previous?.displayOrder ? { from: previous?.displayOrder, to: slide.displayOrder } : undefined,
          active: active !== undefined && active !== previous?.active ? { from: previous?.active, to: slide.active } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ slide });
  }),
);

resourceRouter.delete(
  "/hero-slides/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.heroSlide.findUnique({ where: { id } });
    await prisma.heroSlide.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "hero_slide_delete",
      metadata: {
        target: previous?.title || id,
        id,
        deletedTitle: previous?.title,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

// ─── FAQ Directory ───────────────────────────────────────────────────────────
resourceRouter.get(
  "/faqs",
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === "true";
    const faqs = await prisma.faqItem.findMany({
      where: showAll ? undefined : { active: true },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });
    res.status(200).json({ faqs });
  }),
);

resourceRouter.post(
  "/faqs",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { question, answer, category, displayOrder, active } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Question and Answer are required." });
    }
    const faq = await prisma.faqItem.create({
      data: {
        question,
        answer,
        category: category || "general",
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        active: typeof active === "boolean" ? active : true,
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "faq_create",
      metadata: {
        target: faq.question,
        id: faq.id,
        question: faq.question,
        category: faq.category,
        displayOrder: faq.displayOrder,
      },
      req,
    });

    res.status(201).json({ faq });
  }),
);

resourceRouter.patch(
  "/faqs/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question, answer, category, displayOrder, active } = req.body;
    const previous = await prisma.faqItem.findUnique({ where: { id } });
    const faq = await prisma.faqItem.update({
      where: { id },
      data: {
        ...(question !== undefined ? { question } : {}),
        ...(answer !== undefined ? { answer } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "faq_update",
      metadata: {
        target: faq.question || previous?.question || id,
        id,
        changes: {
          question: question !== undefined && question !== previous?.question ? { from: previous?.question, to: faq.question } : undefined,
          answer: answer !== undefined && answer !== previous?.answer ? { from: previous?.answer, to: faq.answer } : undefined,
          category: category !== undefined && category !== previous?.category ? { from: previous?.category, to: faq.category } : undefined,
          displayOrder: displayOrder !== undefined && displayOrder !== previous?.displayOrder ? { from: previous?.displayOrder, to: faq.displayOrder } : undefined,
          active: active !== undefined && active !== previous?.active ? { from: previous?.active, to: faq.active } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ faq });
  }),
);

resourceRouter.delete(
  "/faqs/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.faqItem.findUnique({ where: { id } });
    await prisma.faqItem.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "faq_delete",
      metadata: {
        target: previous?.question || id,
        id,
        deletedQuestion: previous?.question,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

// ─── Announcements / Newsletter Management ────────────────────────────────────
resourceRouter.get(
  "/announcements",
  asyncHandler(async (_req, res) => {
    const announcements = await prisma.announcement.findMany();
    sortAnnouncementsNewestFirst(announcements);
    res.status(200).json({ announcements });
  }),
);

resourceRouter.post(
  "/announcements",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { title, summary, detail, category, refNumber, publishedAt } = req.body;
    if (!title || !summary) {
      return res.status(400).json({ error: "Title and summary are required." });
    }

    let assignedRef = typeof refNumber === "string" ? refNumber.trim() : "";
    if (!assignedRef) {
      const existing = await prisma.announcement.findMany({
        select: { refNumber: true },
      });
      assignedRef = getNextAnnouncementId(existing.map((e) => e.refNumber));
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        summary,
        detail: detail || null,
        category: category || "general",
        refNumber: assignedRef,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "announcement_create",
      metadata: {
        target: announcement.title,
        id: announcement.id,
        title: announcement.title,
        refNumber: announcement.refNumber,
        category: announcement.category,
      },
      req,
    });

    res.status(201).json({ announcement });
  }),
);

resourceRouter.patch(
  "/announcements/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, summary, detail, category, refNumber, publishedAt } = req.body;
    const previous = await prisma.announcement.findUnique({ where: { id } });
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(summary !== undefined ? { summary } : {}),
        ...(detail !== undefined ? { detail } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(refNumber !== undefined ? { refNumber } : {}),
        ...(publishedAt !== undefined ? { publishedAt: new Date(publishedAt) } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "announcement_update",
      metadata: {
        target: announcement.title || previous?.title || id,
        id,
        changes: {
          title: title !== undefined && title !== previous?.title ? { from: previous?.title, to: announcement.title } : undefined,
          summary: summary !== undefined && summary !== previous?.summary ? { from: previous?.summary, to: announcement.summary } : undefined,
          category: category !== undefined && category !== previous?.category ? { from: previous?.category, to: announcement.category } : undefined,
          refNumber: refNumber !== undefined && refNumber !== previous?.refNumber ? { from: previous?.refNumber, to: announcement.refNumber } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ announcement });
  }),
);

resourceRouter.delete(
  "/announcements/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.announcement.findUnique({ where: { id } });
    await prisma.announcement.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "announcement_delete",
      metadata: {
        target: previous?.title || id,
        id,
        deletedTitle: previous?.title,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

// ─── Theme / Problem Categories Management Routes ─────────────────────────────

resourceRouter.get(
  "/themes",
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === "true";
    const items = await prisma.problemCategory.findMany({
      where: showAll ? undefined : { active: true },
      orderBy: [{ theme: "asc" }, { displayOrder: "asc" }, { code: "asc" }],
    });
    res.status(200).json({ items });
  }),
);

resourceRouter.post(
  "/themes",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { code, theme, label, psTitle, psUrl, psId, openId, badgeBg, badgeText, displayOrder, active } = req.body;
    if (!code || !theme || !label) {
      return res.status(400).json({ error: "Code, theme, and label are required." });
    }
    const normalizedCode = String(code).trim().toUpperCase();
    const existing = await prisma.problemCategory.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      return res.status(400).json({ error: `Theme code "${normalizedCode}" already exists.` });
    }

    let order = typeof displayOrder === "number" ? displayOrder : 0;
    if (order === 0) {
      const lastInTheme = await prisma.problemCategory.findFirst({
        where: { theme },
        orderBy: { displayOrder: "desc" },
      });
      order = (lastInTheme?.displayOrder ?? 0) + 1;
    }

    const defaultPsId = theme === "NATIONAL" ? `${normalizedCode}-PS` : null;
    const defaultOpenId = `${normalizedCode}-OP`;

    const item = await prisma.problemCategory.create({
      data: {
        code: normalizedCode,
        theme: theme === "NATIONAL" ? "NATIONAL" : "REGIONAL",
        label: String(label).trim(),
        psTitle: psTitle ? String(psTitle).trim() : null,
        psUrl: psUrl ? String(psUrl).trim() : null,
        psId: psId ? String(psId).trim() : defaultPsId,
        openId: openId ? String(openId).trim() : defaultOpenId,
        badgeBg: badgeBg ? String(badgeBg).trim() : null,
        badgeText: badgeText ? String(badgeText).trim() : null,
        displayOrder: order,
        active: typeof active === "boolean" ? active : true,
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "theme_create",
      metadata: {
        target: `${item.label} (${item.code})`,
        id: item.id,
        code: item.code,
        theme: item.theme,
        label: item.label,
        displayOrder: item.displayOrder,
      },
      req,
    });

    res.status(201).json({ item });
  }),
);

resourceRouter.put(
  "/themes/reorder",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "updates array is required." });
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.problemCategory.update({
          where: { id: u.id },
          data: {
            displayOrder: typeof u.displayOrder === "number" ? u.displayOrder : 0,
          },
        }),
      ),
    );

    await writeAuditLog({
      userId: req.user?.id,
      action: "theme_layout_reorder",
      metadata: {
        target: `${updates.length} Themes/Statements`,
        count: updates.length,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

resourceRouter.patch(
  "/themes/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { label, psTitle, psUrl, psId, openId, badgeBg, badgeText, displayOrder, active, theme } = req.body;

    const previous = await prisma.problemCategory.findUnique({ where: { id } });
    if (!previous) {
      return res.status(404).json({ error: "Problem category not found." });
    }

    const item = await prisma.problemCategory.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label: String(label).trim() } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(psTitle !== undefined ? { psTitle: psTitle ? String(psTitle).trim() : null } : {}),
        ...(psUrl !== undefined ? { psUrl: psUrl ? String(psUrl).trim() : null } : {}),
        ...(psId !== undefined ? { psId: psId ? String(psId).trim() : null } : {}),
        ...(openId !== undefined ? { openId: openId ? String(openId).trim() : null } : {}),
        ...(badgeBg !== undefined ? { badgeBg: badgeBg ? String(badgeBg).trim() : null } : {}),
        ...(badgeText !== undefined ? { badgeText: badgeText ? String(badgeText).trim() : null } : {}),
        ...(typeof displayOrder === "number" ? { displayOrder } : {}),
        ...(typeof active === "boolean" ? { active } : {}),
      },
    });

    await writeAuditLog({
      userId: req.user?.id,
      action: "theme_update",
      metadata: {
        target: `${item.label} (${item.code})`,
        id,
        changes: {
          label: label !== undefined && label !== previous.label ? { from: previous.label, to: item.label } : undefined,
          displayOrder: displayOrder !== undefined && displayOrder !== previous.displayOrder ? { from: previous.displayOrder, to: item.displayOrder } : undefined,
          active: active !== undefined && active !== previous.active ? { from: previous.active, to: item.active } : undefined,
          psTitle: psTitle !== undefined && psTitle !== previous.psTitle ? { from: previous.psTitle, to: item.psTitle } : undefined,
          psUrl: psUrl !== undefined && psUrl !== previous.psUrl ? { from: previous.psUrl, to: item.psUrl } : undefined,
        },
      },
      req,
    });

    res.status(200).json({ item });
  }),
);

resourceRouter.delete(
  "/themes/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "RESOURCE"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const previous = await prisma.problemCategory.findUnique({ where: { id } });
    if (!previous) {
      return res.status(404).json({ error: "Problem category not found." });
    }

    const linkedTeamsCount = await prisma.team.count({
      where: { problemCategoryCode: previous.code },
    });

    if (linkedTeamsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete theme "${previous.code}" because ${linkedTeamsCount} team(s) are registered under it. Consider deactivating it instead.`,
      });
    }

    await prisma.problemCategory.delete({ where: { id } });

    await writeAuditLog({
      userId: req.user?.id,
      action: "theme_delete",
      metadata: {
        target: `${previous.label} (${previous.code})`,
        id,
        deletedCode: previous.code,
        deletedLabel: previous.label,
      },
      req,
    });

    res.status(200).json({ success: true });
  }),
);

