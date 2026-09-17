import { prisma } from "../config/prisma.js";
import { hashPassword, verifyPassword, verifyOtpAgainstDummy } from "../utils/hash.js";
import { AppError } from "../middleware/errorHandler.js";
import { issueOtp, consumeOtp } from "./otp.service.js";
import type { ResetPasswordInput, SignupInput, SigninInput } from "../schemas/auth.schema.js";


export async function signupUser(input: SignupInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const passwordHash = await hashPassword(input.password);

  if (existing) {
    // Only an unverified pending account can be replaced.
    if (!existing.emailVerified && existing.status === "pending") {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });

      await issueOtp(user.id, user.email, "email_verify");

      return user;
    }

    throw new AppError(409, "An account with this email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      status: "pending",
      emailVerified: false,
    },
  });

  await issueOtp(user.id, user.email, "email_verify");

  return user;
}

export async function verifySignupOtp(
  email: string,
  code: string,
  password?: string,
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await verifyOtpAgainstDummy(code);
    throw new AppError(400, "Incorrect or expired code.");
  }

  if (user.status === "suspended") {
    throw new AppError(403, "This account cannot be verified.");
  }

  const isValid = await consumeOtp(user.id, "email_verify", code);

  if (!isValid) {
    throw new AppError(400, "Incorrect or expired code.");
  }

  const data: {
    emailVerified: boolean;
    status: "active";
    passwordHash?: string;
    tokenVersion: { increment: number };
  } = {
    emailVerified: true,
    status: "active",
    tokenVersion: { increment: 1 },
  };

  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  return prisma.user.update({
    where: { id: user.id },
    data,
  });
}

export async function authenticateUser(input: SigninInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Constant-shape response whether the email exists or not - don't leak
  // account existence. Always run the password check against *something*
  // to avoid a timing side-channel that distinguishes "no such user" from
  // "wrong password".
  const passwordHash = user?.passwordHash ?? "$2b$12$invalidsaltinvalidsaltinvalidsaltu";
  const isValid = await verifyPassword(input.password, passwordHash);

  if (!user || !isValid) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (user.status === "suspended") {
    throw new AppError(403, "This account has been suspended. Contact support.");
  }

  if (user.status === "pending" || !user.emailVerified) {
    throw new AppError(403, "Please verify your email before signing in.");
  }

  return user;
}




/**
 * Starts a password reset. Deliberately returns void regardless of whether
 * the account exists - the controller always responds identically, so this
 * endpoint can't be used to enumerate registered emails.
 *
 * Returns the user id when one was found, purely so the caller can attach
 * it to the audit log. Callers must not branch their HTTP response on it.
 */
export async function requestPasswordReset(email: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({ where: { email } });

  // An unverified or suspended account can't reset a password: for the
  // former, email ownership was never proven; for the latter, a reset
  // would be a way to quietly regain access.
  if (!user || !user.emailVerified || user.status === "suspended") return undefined;

  try {
    await issueOtp(user.id, user.email, "password_reset");
  } catch (err) {
    // Swallow the cooldown 429 only - otherwise a repeated request would
    // reveal that this email is registered while an unknown one wouldn't.
    if (err instanceof AppError && err.statusCode === 429) return user.id;
    throw err;
  }

  return user.id;
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same generic error for "no such user" and "wrong code" - see above.
  if (!user) throw new AppError(400, "Incorrect or expired code.");

  const isValid = await consumeOtp(user.id, "password_reset", input.code);
  if (!isValid) throw new AppError(400, "Incorrect or expired code.");

  const passwordHash = await hashPassword(input.password);

  return prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });
}



