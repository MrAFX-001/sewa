import type { Request, Response } from "express";
import { env, isProd } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { signSession } from "../utils/jwt.js";
import { writeAuditLog } from "../lib/audit.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  authenticateUser,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  signupUser,
  verifySignupOtp,
} from "../services/auth.service.js";
import { issueOtp } from "../services/otp.service.js";
import type {
  ForgotPasswordInput,
  OtpSendInput,
  OtpVerifyInput,
  ResetPasswordInput,
  SigninInput,
  SignupInput,
} from "../schemas/auth.schema.js";

const cookieOptions = {
  httpOnly: true,
  secure: isProd, // requires HTTPS in production
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function setSessionCookie(
  res: Response,
  userId: string,
  email: string,
  tokenVersion: number,
) {
  const token = signSession({
    sub: userId,
    email,
    ver: tokenVersion,
  });

  res.cookie(env.COOKIE_NAME, token, cookieOptions);
}

export async function signup(req: Request, res: Response) {
  const input = req.body as SignupInput;
  const user = await signupUser(input);

  await writeAuditLog({ req, userId: user.id, action: "signup", metadata: { email: user.email } });

  res.status(201).json({
    message: "Account created. Check your email for a verification code.",
    email: user.email,
  });
}

export async function resendOtp(req: Request, res: Response) {
  const { email } = req.body as OtpSendInput;

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the account exists - always respond the same way.
  if (user && !user.emailVerified) {
    await issueOtp(user.id, user.email, "email_verify");
    await writeAuditLog({ req, userId: user.id, action: "otp_send" });
  }

  res.status(200).json({ message: "If this email is registered, a code has been sent." });
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const { email, code, password } = req.body as OtpVerifyInput;

  try {
    const user = await verifySignupOtp(email, code, password);
    await writeAuditLog({ req, userId: user.id, action: "otp_verify_success" });
    setSessionCookie(res, user.id, user.email, user.tokenVersion);
    res.status(200).json({
      message: "Email verified successfully.",
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: (user as any).role || "MEMBER" },
    });
  } catch (err) {
    const existing = await prisma.user.findUnique({ where: { email } });
    await writeAuditLog({ req, userId: existing?.id, action: "otp_verify_failure" });
    throw err;
  }
}

export async function signin(req: Request, res: Response) {
  const input = req.body as SigninInput;

  try {
    const user = await authenticateUser(input);
    await writeAuditLog({ req, userId: user.id, action: "signin_success" });
    setSessionCookie(res, user.id, user.email, user.tokenVersion);
    res.status(200).json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: (user as any).role || "MEMBER" },
    });
  } catch (err) {
    await writeAuditLog({ req, action: "signin_failure", metadata: { email: input.email } });
    throw err;
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as ForgotPasswordInput;

  const userId = await requestPasswordReset(email);
  await writeAuditLog({ req, userId, action: "password_reset_request", metadata: { email } });

  // Identical response whether or not the account exists.
  res.status(200).json({
    message: "If this email is registered, a reset code has been sent.",
  });
}

export async function resetPassword(req: Request, res: Response) {
  const input = req.body as ResetPasswordInput;

  try {
    const user = await resetPasswordService(input);
    await writeAuditLog({ req, userId: user.id, action: "password_reset_success" });

    // Force a fresh sign-in rather than issuing a session here: if the
    // reset was driven by an attacker with mail access, at least it
    // doesn't hand them a logged-in session in the same request.
    res.clearCookie(env.COOKIE_NAME, { path: "/" });
    res.status(200).json({ message: "Password updated. Please sign in." });
  } catch (err) {
    await writeAuditLog({ req, action: "password_reset_failure", metadata: { email: input.email } });
    throw err;
  }
}

export async function signout(req: Request, res: Response) {
  if (req.user?.id) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        tokenVersion: { increment: 1 },
      },
    });
  }

  res.clearCookie(env.COOKIE_NAME, { path: "/" });

  await writeAuditLog({
    req,
    userId: req.user?.id,
    action: "signout",
  });

  res.status(200).json({ message: "Signed out." });
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, emailVerified: true, role: true },
  });
  res.status(200).json({ user });
}
