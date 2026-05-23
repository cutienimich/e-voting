import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req), // ← added this so IPv6 works nicely!
  message: { success: false, message: "Too many attempts. Try again later." }
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req), // ← already good!
  message: { success: false, message: "Too many vote attempts." }
});