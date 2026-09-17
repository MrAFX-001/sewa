import { Prisma, type TeamMember } from "@prisma/client";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { TEAM_MAX_MEMBERS, TEAM_MIN_MEMBERS } from "../schemas/team.schema.js";
import type { AddMemberInput, CreateTeamInput, UpdateTeamInput } from "../schemas/team.schema.js";
import { resolveProblemSelection } from "./problemStatement.service.js";
import { sendTeamMemberAddedEmail, sendTeamRegistrationEmail } from "../utils/mailer.js";

export interface UploadedIdCard {
  /** multer's on-disk filename (a UUID, not the client's original name). */
  path: string;
  mimetype: string;
  originalname: string;
}

export async function createTeam(leaderUserId: string, input: CreateTeamInput, idCard: UploadedIdCard) {
  const existing = await prisma.team.findFirst({ where: { leaderUserId } });
  if (existing) {
    // The upload already landed on disk before this check runs (multer
    // parses the request before validateBody/the controller ever executes),
    // so the now-orphaned file is cleaned up rather than left behind for
    // every rejected duplicate-registration attempt.
    await deleteUploadedFile(idCard.path);
    throw new AppError(409, "You have already registered an entry.");
  }

  const leader = await prisma.user.findUniqueOrThrow({ where: { id: leaderUserId } });

  // Create the team and seed the leader as the first team_members row in
  // one transaction, so team_members is always the single source of truth
  // for roster membership (no team can exist with zero members). The
  // problem-selection resolution (which may assign a sequence number) also
  // has to be inside this same transaction - see problemStatement.service.ts.
  try {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { theme, problemStatement, problemStatementId } = await resolveProblemSelection(tx, input);

      const team = await tx.team.create({
        data: {
          name: input.name,
          institute: input.institute,
          institutionAddress: input.institutionAddress,
          participationType: input.participationType,
          participantCategory: input.participantCategory,
          participationLevel: input.participationLevel,
          institutionType: input.institutionType ?? null,
          affiliationPinCode: input.affiliationPinCode ?? null,
          affiliationCity: input.affiliationCity ?? null,
          affiliationState: input.affiliationState ?? null,
          institutionEmail: input.institutionEmail ?? null,
          institutionPhone: input.institutionPhone ?? null,
          classLevel: input.classLevel ?? null,
          degreeProgramme: input.degreeProgramme ?? null,
          departmentBranch: input.departmentBranch ?? null,
          yearOfStudy: input.yearOfStudy ?? null,
          coordinatorName: input.coordinatorName ?? null,
          coordinatorEmail: input.coordinatorEmail ?? null,
          coordinatorPhone: input.coordinatorPhone ?? null,
          designationRole: input.designationRole ?? null,
          departmentDivision: input.departmentDivision ?? null,
          officialOrgEmail: input.officialOrgEmail ?? null,
          orgContactPhone: input.orgContactPhone ?? null,
          mentorName: input.mentorName ?? null,
          mentorDesignation: input.mentorDesignation ?? null,
          mentorEmail: input.mentorEmail ?? null,
          mentorPhone: input.mentorPhone ?? null,
          theme,
          problemStatement,
          problemCategoryCode: input.problemCategoryCode,
          problemOptionType: input.problemOptionType,
          proposedProblemStatement: input.problemOptionType === "open" ? input.proposedProblemStatement : null,
          problemStatementId,
          idCardPath: idCard.path,
          idCardMimeType: idCard.mimetype,
          idCardOriginalName: idCard.originalname,
          leaderUserId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: leader.id,
          firstName: leader.firstName,
          lastName: leader.lastName,
          email: leader.email,
          phone: leader.phone,
          idCardPath: idCard.path,
          idCardMimeType: idCard.mimetype,
          idCardOriginalName: idCard.originalname,
          role: "leader",
        },
      });

      return team;
    });
  } catch (err) {
    await deleteUploadedFile(idCard.path);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(409, "You have already registered an entry.");
    }

    throw err;
  }
}

export async function updateTeam(
  teamId: string,
  leaderUserId: string,
  input: UpdateTeamInput,
  idCard: UploadedIdCard | undefined,
) {
  const existingTeam = await getOwnedTeamOrThrow(teamId, leaderUserId); // also enforces draft-only via its status check
  const previousIdCardPath = existingTeam.idCardPath;
  const previousLeaderIdCardPath = existingTeam.members.find((member: TeamMember) => member.role === "leader")?.idCardPath ?? null;
  const MAX_RETRIES = 3;

  let updated: Awaited<ReturnType<typeof prisma.team.findUniqueOrThrow>>;

  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        updated = await prisma.$transaction(
          async (tx) => {
            const { theme, problemStatement, problemStatementId } =
              await resolveProblemSelection(tx, input);

            const result = await tx.team.updateMany({
              where: {
                id: teamId,
                leaderUserId,
                status: "draft",
              },
              data: {
                name: input.name,
                institute: input.institute,
                institutionAddress: input.institutionAddress,
                participationType: input.participationType,
                participantCategory: input.participantCategory,
                participationLevel: input.participationLevel,
                institutionType: input.institutionType ?? null,
                affiliationPinCode: input.affiliationPinCode ?? null,
                affiliationCity: input.affiliationCity ?? null,
                affiliationState: input.affiliationState ?? null,
                institutionEmail: input.institutionEmail ?? null,
                institutionPhone: input.institutionPhone ?? null,
                classLevel: input.classLevel ?? null,
                degreeProgramme: input.degreeProgramme ?? null,
                departmentBranch: input.departmentBranch ?? null,
                yearOfStudy: input.yearOfStudy ?? null,
                coordinatorName: input.coordinatorName ?? null,
                coordinatorEmail: input.coordinatorEmail ?? null,
                coordinatorPhone: input.coordinatorPhone ?? null,
                designationRole: input.designationRole ?? null,
                departmentDivision: input.departmentDivision ?? null,
                officialOrgEmail: input.officialOrgEmail ?? null,
                orgContactPhone: input.orgContactPhone ?? null,
                mentorName: input.mentorName ?? null,
                mentorDesignation: input.mentorDesignation ?? null,
                mentorEmail: input.mentorEmail ?? null,
                mentorPhone: input.mentorPhone ?? null,
                theme,
                problemStatement,
                problemCategoryCode: input.problemCategoryCode,
                problemOptionType: input.problemOptionType,
                proposedProblemStatement:
                  input.problemOptionType === "open"
                    ? input.proposedProblemStatement
                    : null,
                problemStatementId,
                ...(idCard && {
                  idCardPath: idCard.path,
                  idCardMimeType: idCard.mimetype,
                  idCardOriginalName: idCard.originalname,
                }),
              },
            });

            if (idCard) {
              await tx.teamMember.updateMany({
                where: { teamId, role: "leader" },
                data: {
                  idCardPath: idCard.path,
                  idCardMimeType: idCard.mimetype,
                  idCardOriginalName: idCard.originalname,
                },
              });
            }

            if (result.count !== 1) {
              throw new AppError(
                409,
                "Registration has already been submitted and can no longer be edited.",
              );
            }

            return tx.team.findUniqueOrThrow({
              where: { id: teamId },
            });
          },
          {
            isolationLevel: "Serializable",
          },
        );

        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2034" &&
          attempt < MAX_RETRIES
        ) {
          continue;
        }

        throw err;
      }
    }
  } catch (err) {
    // The update did not commit - the NEW upload (if any) is orphaned and
    // the OLD file is still the one actually referenced by the team, so
    // only the new one is cleaned up here.
    if (idCard) await deleteUploadedFile(idCard.path);
    throw err;
  }

  if (!updated!) {
    throw new AppError(500, "Could not update team.");
  }

  // Update committed. Only now, on the success path, is the PREVIOUS card
  // actually superseded and safe to remove.
  if (idCard) {
    const oldPaths = new Set([previousIdCardPath, previousLeaderIdCardPath].filter(Boolean) as string[]);
    for (const oldPath of oldPaths) {
      if (oldPath !== idCard.path) {
        await deleteUploadedFile(oldPath).catch(() => {
          // Best-effort cleanup; never fail a committed update because of disk cleanup.
        });
      }
    }
  }

  return updated;
}

async function deleteUploadedFile(storedFilename: string) {
  try {
    await unlink(path.join(env.UPLOAD_DIR, path.basename(storedFilename)));
  } catch {
    // File may already be gone, or never existed (e.g. called on a bad
    // input path) - either way this is cleanup, not a critical operation.
  }
}

async function getOwnedTeamOrThrow(teamId: string, leaderUserId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });

  if (!team) throw new AppError(404, "Team not found.");
  if (team.leaderUserId !== leaderUserId) throw new AppError(403, "Not authorized for this team.");
  if (team.status !== "draft") throw new AppError(409, "Registration has already been submitted and can no longer be edited.");

  return team;
}

export async function addTeamMember(
  teamId: string,
  leaderUserId: string,
  input: AddMemberInput,
  idCard: UploadedIdCard,
) {
  const MAX_RETRIES = 3;

  let newMember: TeamMember | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      newMember = await prisma.$transaction(
        async (tx) => {
          const team = await tx.team.findUnique({
            where: { id: teamId },
            include: { members: true },
          });

          if (!team) throw new AppError(404, "Team not found.");
          if (team.leaderUserId !== leaderUserId) {
            throw new AppError(403, "Not authorized for this team.");
          }
          if (team.status !== "draft") {
            throw new AppError(
              409,
              "Registration has already been submitted and can no longer be edited.",
            );
          }

          if (team.participationType === "Individual" && team.members.length >= 1) {
            throw new AppError(409, "An Individual registration can have only one participant.");
          }

          if (team.members.length >= TEAM_MAX_MEMBERS) {
            throw new AppError(
              409,
              `${team.participationType === "Individual" ? "An individual entry" : "A team"} can have at most ${TEAM_MAX_MEMBERS} members.`,
            );
          }

          if (team.members.some((m: TeamMember) => m.email === input.email)) {
            throw new AppError(409, "This email is already part of the team.");
          }

          try {
            return await tx.teamMember.create({
              data: {
                teamId,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phone: input.phone,
                idCardPath: idCard.path,
                idCardMimeType: idCard.mimetype,
                idCardOriginalName: idCard.originalname,
                role: "member",
              },
            });
          } catch (err) {
            await deleteUploadedFile(idCard.path);
            throw err;
          }
        },
        {
          isolationLevel: "Serializable",
        },
      );

      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        attempt < MAX_RETRIES
      ) {
        continue;
      }

      await deleteUploadedFile(idCard.path);
      throw err;
    }
  }

  if (!newMember) {
    await deleteUploadedFile(idCard.path);
    throw new AppError(500, "Could not add team member.");
  }

  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
  });

  const members = await prisma.teamMember.findMany({
    where: { teamId },
  });

  const leader = members.find((m: TeamMember) => m.role === "leader");
  const leaderName = leader
    ? `${leader.firstName} ${leader.lastName}`
    : "Your team leader";

  sendTeamMemberAddedEmail(
    newMember.email,
    {
      firstName: newMember.firstName,
      lastName: newMember.lastName,
    },
    {
      name: team.name,
      institute: team.institute,
      theme: team.theme,
    },
    leaderName,
  ).catch(() => {
    // Handled & logged in mailer
  });

  return newMember;
}

export async function updateTeamMember(
  teamId: string,
  leaderUserId: string,
  memberId: string,
  input: AddMemberInput,
  idCard: UploadedIdCard | undefined,
) {
  const team = await getOwnedTeamOrThrow(teamId, leaderUserId);
  const member = team.members.find((candidate: TeamMember) => candidate.id === memberId);

  if (!member) throw new AppError(404, "Member not found.");
  if (member.role === "leader") throw new AppError(400, "The team leader is managed through the main registration form.");

  if (team.members.some((candidate: TeamMember) => candidate.id !== memberId && candidate.email.toLowerCase() === input.email.toLowerCase())) {
    if (idCard) await deleteUploadedFile(idCard.path);
    throw new AppError(409, "This email is already part of the team.");
  }

  try {
    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        ...(idCard && {
          idCardPath: idCard.path,
          idCardMimeType: idCard.mimetype,
          idCardOriginalName: idCard.originalname,
        }),
      },
    });

    if (idCard && member.idCardPath && member.idCardPath !== idCard.path) {
      await deleteUploadedFile(member.idCardPath);
    }

    return updated;
  } catch (err) {
    if (idCard) await deleteUploadedFile(idCard.path);
    throw err;
  }
}

export async function removeTeamMember(
  teamId: string,
  leaderUserId: string,
  memberId: string,
) {
  const MAX_RETRIES = 3;
  let removedCardPath: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const team = await tx.team.findUnique({
            where: { id: teamId },
            include: { members: true },
          });

          if (!team) {
            throw new AppError(404, "Team not found.");
          }

          if (team.leaderUserId !== leaderUserId) {
            throw new AppError(403, "Not authorized for this team.");
          }

          if (team.status !== "draft") {
            throw new AppError(
              409,
              "Registration has already been submitted and can no longer be edited.",
            );
          }

          const member = team.members.find(
            (m: TeamMember) => m.id === memberId,
          );

          if (!member) {
            throw new AppError(404, "Member not found.");
          }

          if (member.role === "leader") {
            throw new AppError(400, "The team leader cannot be removed.");
          }

          removedCardPath = member.idCardPath ?? null;

          const result = await tx.teamMember.deleteMany({
            where: {
              id: memberId,
              teamId,
              team: {
                leaderUserId,
                status: "draft",
              },
            },
          });

          if (result.count !== 1) {
            throw new AppError(
              409,
              "Registration has already been submitted and can no longer be edited.",
            );
          }
        },
        {
          isolationLevel: "Serializable",
        },
      );

      if (removedCardPath) {
        await deleteUploadedFile(removedCardPath);
      }
      return;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        attempt < MAX_RETRIES
      ) {
        continue;
      }

      throw err;
    }
  }

  throw new AppError(500, "Could not remove team member.");
}

export async function submitTeam(teamId: string, leaderUserId: string) {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const updatedTeam = await prisma.$transaction(
        async (tx) => {
          const team = await tx.team.findUnique({
            where: { id: teamId },
            include: { members: true },
          });

          if (!team) {
            throw new AppError(404, "Team not found.");
          }

          if (team.leaderUserId !== leaderUserId) {
            throw new AppError(403, "Not authorized for this team.");
          }

          if (team.status !== "draft") {
            throw new AppError(
              409,
              "Registration has already been submitted and can no longer be edited.",
            );
          }

          const minMembers = team.participationType === "Individual" ? 1 : TEAM_MIN_MEMBERS;
          const maxMembers = TEAM_MAX_MEMBERS;

          if (team.members.length < minMembers || team.members.length > maxMembers) {
            const noun = team.participationType === "Individual" ? "individual entry" : "team";
            throw new AppError(
              400,
              team.members.length < minMembers
                ? `${noun} needs at least ${minMembers} member${minMembers === 1 ? "" : "s"} to submit.`
                : `${noun} can have at most ${maxMembers} members.`,
            );
          }

          const missingDocument = team.members.find((member) => !member.idCardPath);
          if (missingDocument) {
            throw new AppError(
              400,
              `Every participant must have a Student / Institution ID Card. Missing document for ${missingDocument.firstName} ${missingDocument.lastName}.`,
            );
          }

          const result = await tx.team.updateMany({
            where: {
              id: teamId,
              leaderUserId,
              status: "draft",
            },
            data: {
              status: "submitted",
              submittedAt: new Date(),
            },
          });

          if (result.count !== 1) {
            throw new AppError(
              409,
              "Registration has already been submitted and can no longer be edited.",
            );
          }

          return tx.team.findUniqueOrThrow({
            where: { id: teamId },
            include: { members: true },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );

      const recipients = updatedTeam.members.map(
        (m: TeamMember) => m.email,
      );

      sendTeamRegistrationEmail(recipients, updatedTeam).catch(() => {
        // Handled & logged in mailer
      });

      return updatedTeam;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034" &&
        attempt < MAX_RETRIES
      ) {
        continue;
      }

      throw err;
    }
  }

  throw new AppError(500, "Could not submit team.");
}

export async function getMyTeam(leaderUserId: string) {
  return prisma.team.findFirst({
    where: { leaderUserId },
    include: { members: true },
  });
}


