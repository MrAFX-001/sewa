import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  signupLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  signinLimiter,
  passwordResetRequestLimiter,
  passwordResetConfirmLimiter,
} from "../middleware/rateLimiter.js";
import {
  signupSchema,
  otpSendSchema,
  otpVerifySchema,
  signinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/signup", signupLimiter, validateBody(signupSchema), asyncHandler(authController.signup));

authRouter.post(
  "/otp/send",
  otpSendLimiter,
  validateBody(otpSendSchema),
  asyncHandler(authController.resendOtp),
);

authRouter.post(
  "/otp/verify",
  otpVerifyLimiter,
  validateBody(otpVerifySchema),
  asyncHandler(authController.verifyOtpHandler),
);

authRouter.post("/signin", signinLimiter, validateBody(signinSchema), asyncHandler(authController.signin));

authRouter.post(
  "/password/forgot",
  passwordResetRequestLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

authRouter.post(
  "/password/reset",
  passwordResetConfirmLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

authRouter.post("/signout", requireAuth, asyncHandler(authController.signout));

authRouter.get("/me", requireAuth, asyncHandler(authController.me));


