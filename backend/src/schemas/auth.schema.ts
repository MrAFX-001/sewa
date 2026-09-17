import { z } from "zod";
import { phoneSchema } from "./phone.js";

// At least one lowercase, one uppercase, one digit, one special char.
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .regex(passwordRegex, "Password must include upper, lower, number, and special character");

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: phoneSchema.optional(),
    password: passwordSchema,
  })
  .strict();

export const otpSendSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
  })
  .strict();

export const otpVerifySchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d+$/, "OTP must be numeric"),
    password: passwordSchema.optional(),
  })
  .strict();

export const signinSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d+$/, "OTP must be numeric"),
    password: passwordSchema,
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;