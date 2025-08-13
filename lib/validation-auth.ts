// lib/validation-auth.ts
import { z } from "zod";

// Allow letters, numbers, dot, underscore, hyphen; 3–20 chars
export const zUsername = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dot, underscore, and hyphen");

export const RESERVED_USERNAMES = new Set([
  "admin","root","support","help","about","contact","settings",
  "inbox","profile","jobs","post","signin","signup","api"
]);

export const zPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine((v) => /[a-z]/.test(v), "Needs a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Needs an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Needs a number")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Needs a symbol");
