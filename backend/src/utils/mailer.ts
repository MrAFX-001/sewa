import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type OtpEmailPurpose = "email_verify" | "password_reset";

const COPY: Record<OtpEmailPurpose, { subject: string; lead: string }> = {
  email_verify: {
    subject: "Your SEWA 2026 verification code",
    lead: "Your verification code is",
  },
  password_reset: {
    subject: "Your SEWA 2026 password reset code",
    lead: "Your password reset code is",
  },
};

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpEmailPurpose = "email_verify",
): Promise<void> {
  const { subject, lead } = COPY[purpose];

  // Local development only (DEV_PRINT_OTP=true, refused in production):
  // print the OTP so signup can be tested without SMTP.
  if (env.DEV_PRINT_OTP) {
    // eslint-disable-next-line no-console
    console.log(`\n==============================================\n🔑 [DEV MODE] OTP for ${to}: ${code}\n==============================================\n`);
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text: `${lead} ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
      html: `<p>${lead} <strong>${code}</strong>.</p>
             <p>It expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone, including SEWA staff.</p>`,
    });
    logger.info({ to, purpose }, "otp_email_sent");
  } catch (err) {
    if (env.DEV_PRINT_OTP) {
      logger.warn({ err: (err as Error).message, to }, "SMTP delivery failed/timed out in development. Use terminal OTP above.");
    } else {
      throw err;
    }
  }
}

export interface TeamEmailPayload {
  id: string;
  name: string;
  institute: string;
  theme: string;
  problemStatement: string;
  submittedAt?: Date | null;
  members: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    role: string;
  }>;
}

export async function sendTeamRegistrationEmail(
  recipients: string[],
  team: TeamEmailPayload,
): Promise<void> {
  if (!recipients.length) return;

  const subject = `SEWA 2026: Team Registration Confirmed - ${team.name}`;

  const memberListText = team.members
    .map(
      (m, idx) =>
        `  ${idx + 1}. ${m.firstName} ${m.lastName} (${m.role.toUpperCase()}) - ${m.email}${m.phone ? ` | ${m.phone}` : ""}`,
    )
    .join("\n");

  const memberListHtml = team.members
    .map(
      (m) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 500; color: #111827;">${m.firstName} ${m.lastName}</td>
        <td style="padding: 10px 12px; color: #4b5563;">
          <span style="display: inline-block; padding: 2px 8px; font-size: 12px; font-weight: 600; border-radius: 9999px; background-color: ${
            m.role === "leader" ? "#dbeafe; color: #1e40af" : "#f3f4f6; color: #374151"
          }; text-transform: uppercase;">${m.role}</span>
        </td>
        <td style="padding: 10px 12px; color: #4b5563;">${m.email}</td>
        <td style="padding: 10px 12px; color: #4b5563;">${m.phone || "-"}</td>
      </tr>`,
    )
    .join("");

  const textBody = `
Dear Team ${team.name},

Congratulations! Your team registration for the SEWA 2026 Youth Innovation Challenge has been successfully submitted.

Team Details:
- Team Name: ${team.name}
- Team ID: ${team.id}
- Institution: ${team.institute}
- Theme: ${team.theme}
- Problem Statement: ${team.problemStatement}

Team Members:
${memberListText}

What's Next?
1. The evaluation committee is currently reviewing submissions.
2. Shortlisted teams will be notified via email for the next evaluation round.
3. Keep an eye on your inbox and ensure all team members stay tuned for updates.

If you have any questions or require support, please reply to this email or reach out to the SEWA 2026 Organizing Committee.

Best regards,
SEWA 2026 Organizing Committee
DTU Youth Innovation Challenge
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 28px 24px; color: #374151; font-size: 15px; line-height: 1.6; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { color: #64748b; font-weight: 500; }
    .card-value { color: #0f172a; font-weight: 600; text-align: right; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; text-align: left; }
    .table th { background-color: #f3f4f6; padding: 10px 12px; color: #4b5563; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .badge-success { display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 600; padding: 4px 12px; border-radius: 9999px; font-size: 13px; }
    .steps-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 24px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; background-color: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SEWA 2026</h1>
      <p>DTU Youth Innovation Challenge</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge-success">✓ Registration Submitted</span>
      </div>
      <p>Dear <strong>${team.name}</strong>,</p>
      <p>Your team registration for the <strong>SEWA 2026 Youth Innovation Challenge</strong> has been successfully submitted and confirmed.</p>

      <div class="card">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Team Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${team.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Team Reference ID:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right; font-family: monospace;">${team.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Institution:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${team.institute}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Theme:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${team.theme}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Problem Statement:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${team.problemStatement}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 16px; margin: 24px 0 12px 0; color: #111827;">Team Roster</h3>
      <div style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            ${memberListHtml}
          </tbody>
        </table>
      </div>

      <div class="steps-box">
        <strong style="color: #1e40af; font-size: 14px; display: block; margin-bottom: 6px;">What's next?</strong>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e3a8a;">
          <li>Your submission is now with the evaluation committee for initial screening.</li>
          <li>Shortlisted teams will receive stage-2 guidelines and pitch schedules via email.</li>
          <li>Ensure all team members keep an eye on their registered inboxes for updates.</li>
        </ol>
      </div>

      <p style="margin-top: 24px; font-size: 14px;">If you have any questions or notice any discrepancy in your details, please reach out immediately.</p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">SEWA 2026 Organizing Committee • Delhi Technological University</p>
      <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email if automated.</p>
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: recipients,
      subject,
      text: textBody,
      html: htmlBody,
    });
    logger.info({ teamId: team.id, recipientCount: recipients.length }, "team_registration_email_sent");
  } catch (error) {
    logger.error({ err: error, teamId: team.id }, "failed_to_send_team_registration_email");
  }
}

export async function sendTeamMemberAddedEmail(
  to: string,
  member: { firstName: string; lastName: string },
  team: { name: string; institute: string; theme: string },
  leaderName: string,
): Promise<void> {
  const subject = `SEWA 2026: You've been added to Team ${team.name}`;
  const safeMemberFirstName = escapeHtml(member.firstName);
  const safeLeaderName = escapeHtml(leaderName);
  const safeTeamName = escapeHtml(team.name);
  const safeInstitute = escapeHtml(team.institute);
  const safeTheme = escapeHtml(team.theme);

  const textBody = `
Dear ${member.firstName} ${member.lastName},

You have been added as a team member to "${team.name}" by ${leaderName} for the SEWA 2026 Youth Innovation Challenge.

Team Details:
- Team Name: ${team.name}
- Institution: ${team.institute}
- Selected Theme: ${team.theme}

Once your team leader finalizes and submits the team application, you will receive a confirmation with the complete team roster and next steps.

Best regards,
SEWA 2026 Organizing Committee
DTU Youth Innovation Challenge
`.trim();

  const htmlBody = renderTeamMemberAddedHtml(
  member,
  team,
  leaderName,
);

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    logger.info({ to, teamName: team.name }, "team_member_added_email_sent");
  } catch (error) {
    logger.error({ err: error, to, teamName: team.name }, "failed_to_send_team_member_added_email");
  }
}

export interface ContactMessagePayload {
  category: string;
  fullName: string;
  subject: string;
}

/**
 * Sends the "Official automated receipt" the Contact Us page's copy
 * promises ("within 5 minutes"). Failures are logged, not thrown \u2014 same
 * pattern as the team emails above: a mail-provider hiccup here shouldn't
 * turn into a 500 for someone who just successfully filed a grievance, and
 * the row is already durably saved in contact_messages regardless.
 */
export async function sendContactReceiptEmail(
  to: string,
  message: ContactMessagePayload,
): Promise<void> {
  const subject = `SEWA 2026: We've received your message - ${message.subject}`;
  const safeFullName = escapeHtml(message.fullName);
  const safeCategory = escapeHtml(message.category);
  const safeSubject = escapeHtml(message.subject);

  const textBody = `
Dear ${message.fullName},

This confirms we've received your message to SEWA 2026.

Category: ${message.category}
Subject: ${message.subject}

Our team reviews every submission within 24-48 hours. If your query is
urgent, call the Northern Region Coordinator Helpdesk at
+91 11 27871018 (Ext: 442) or +91 11 27871020.

Best regards,
SEWA 2026 Organizing Committee
DTU Youth Innovation Challenge
`.trim();

  const htmlBody = renderContactReceiptHtml(message);

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    logger.info({ to }, "contact_receipt_email_sent");
  } catch (error) {
    logger.error({ err: error, to }, "failed_to_send_contact_receipt_email");
  }
}

export function renderContactReceiptHtml(message: ContactMessagePayload): string {
  const safeFullName = escapeHtml(message.fullName);
  const safeCategory = escapeHtml(message.category);
  const safeSubject = escapeHtml(message.subject);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <div class="container">
    <div class="content">
      <p>Dear <strong>${safeFullName}</strong>,</p>
      <p>This confirms we've received your message to SEWA 2026.</p>

      <div class="card">
        <p><strong>Category:</strong> ${safeCategory}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}

export function renderTeamMemberAddedHtml(
  member: { firstName: string; lastName: string },
  team: { name: string; institute: string; theme: string },
  leaderName: string,
): string {
  const safeMemberFirstName = escapeHtml(member.firstName);
  const safeLeaderName = escapeHtml(leaderName);
  const safeTeamName = escapeHtml(team.name);
  const safeInstitute = escapeHtml(team.institute);
  const safeTheme = escapeHtml(team.theme);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background: #1e3a8a; color: #ffffff; padding: 24px; text-align: center; }
    .content { padding: 24px; color: #374151; font-size: 15px; line-height: 1.6; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">SEWA 2026</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">DTU Youth Innovation Challenge</p>
    </div>
    <div class="content">
      <p>Dear <strong>${safeMemberFirstName}</strong>,</p>
      <p><strong>${safeLeaderName}</strong> has added you as a team member to <strong>${safeTeamName}</strong> for SEWA 2026.</p>

      <div class="card">
        <p style="margin: 0 0 6px 0;"><strong>Team:</strong> ${safeTeamName}</p>
        <p style="margin: 0 0 6px 0;"><strong>Institution:</strong> ${safeInstitute}</p>
        <p style="margin: 0;"><strong>Theme:</strong> ${safeTheme}</p>
      </div>

      <p style="font-size: 14px; color: #6b7280;">When your team leader completes the team submission, you will receive full confirmation and schedule updates.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">SEWA 2026 Organizing Committee</p>
    </div>
  </div>
</body>
</html>
`.trim();
}