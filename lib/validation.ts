// lib/validation.ts
import { z } from "zod";

/* ---------------------------
   Helpers
--------------------------- */

// Coerce "", null, undefined → null, otherwise keep a number
const numberOrNull = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v; // let z.number() catch invalid strings
  }
  return v;
}, z.number().int().nonnegative().nullable());

// Optional short string (treat "", null as undefined)
const optionalShort = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().max(max)
  );

// Optional short string that may be explicitly null
const nullableShort = (max: number) =>
  z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().max(max).nullable().optional()
  );

// Phone: accept formatted (e.g. "(760) 555-1212" or "760-555-1212"),
// ensure 10 digits, expose both formatted and digits via a transform if needed.
const zPhone10 = z
  .string()
  .min(7)
  .max(32)
  .refine(
    (s) => s.replace(/\D/g, "").length === 10,
    "Phone must contain 10 digits"
  );

/* ---------------------------
   Enums (align with Prisma)
--------------------------- */

export const zJobRole = z.enum([
  "barber",
  "cosmetologist",
  "esthetician",
  "nail_tech",
  "lash_tech",
  "tattoo_artist",
  "piercer",
]);

export const zCompModel = z.enum(["booth_rent", "commission", "hourly", "hybrid"]);

export const zEmploymentType = z.enum(["w2", "c1099"]);
export const zSchedule = z.enum(["full_time", "part_time"]); // "Any" is represented as undefined/null

/* ---------------------------
   Location payload (from Map)
--------------------------- */

export const zLocation = z.object({
  lat: z.number(),
  lng: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional().nullable(),
  // The UI sometimes sends address or addressLine1 depending on the flow; allow either.
  address: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  country: z.string().optional(), // e.g. "US"
});

/* ---------------------------
   Job Create (POST /api/jobs)
   - Compensation is optional
   - experienceText/description can be null or omitted
--------------------------- */

export const zJobCreate = z.object({
  businessName: z.string().min(1).max(100),
  title: z.string().min(1).max(120),

  role: zJobRole,
  compModel: zCompModel,

  // Optional compensation fields (may be null/omitted)
  payMin: numberOrNull.optional(),
  payMax: numberOrNull.optional(),
  // Keep unit flexible; UI constrains to "$/hr", "$/d", "$/wk", "$/m", etc.
  payUnit: optionalShort(16).optional(),

  // Keep present for compatibility (invisible in UI is fine)
  payVisible: z.boolean().optional(),

  employmentType: zEmploymentType.nullable().optional(), // null/undefined → display “Any”
  schedule: zSchedule.nullable().optional(),             // null/undefined → display “Any”

  experienceText: nullableShort(20), // allow null or omit; max 20 chars
  // Allow either array[7] of booleans or a day-map object; optional overall
  shiftDays: z
    .union([
      z.array(z.boolean()).length(7),
      z
        .object({
          sun: z.boolean().optional(),
          mon: z.boolean().optional(),
          tue: z.boolean().optional(),
          wed: z.boolean().optional(),
          thu: z.boolean().optional(),
          fri: z.boolean().optional(),
          sat: z.boolean().optional(),
        })
        .partial(),
    ])
    .optional(),

  // Optional, even if UI currently hides/shelves it
  licenses: z.array(z.string()).optional(),

  startDate: z.string().optional().nullable(), // ISO date or omitted

  description: nullableShort(200),

  location: zLocation,

  // Optional photo URLs (first one becomes thumbnail in your UI)
  photos: z.array(z.string()).max(6).optional(),
});

export type JobCreateInput = z.infer<typeof zJobCreate>;

/* ---------------------------
   Jobs search/filter params (client)
   - Keep loose; server will coerce/guard
--------------------------- */

export const zJobSearch = z.object({
  // location-based
  lat: z.preprocess((v) => (v === "" ? undefined : v), z.number()).optional(),
  lng: z.preprocess((v) => (v === "" ? undefined : v), z.number()).optional(),
  // city typed filter is optional; UI may send ""
  city: optionalShort(80).optional(),
  // radius in miles, often from a slider
  radiusMiles: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().min(1).max(100)
    )
    .optional(),

  // domain filters
  service: zJobRole.optional(), // “Any” → omit
  comp: zCompModel.optional(),
  sched: z.union([zSchedule, z.literal("any")]).optional(),
  emp: zEmploymentType.optional(), // employment type

  // misc
  q: optionalShort(100).optional(), // text query
  sort: z.enum(["new", "nearby"]).optional(),
});

export type JobSearchParams = z.infer<typeof zJobSearch>;

/* ---------------------------
   Inquiry (Send Inquiry modal)
--------------------------- */

export const zInquiryCreate = z.object({
  jobId: z.string().min(1, "jobId required"),
  name: z.string().min(1).max(25),
  email: z.string().email().optional().nullable(), // auto-filled; non-editable in UI
  phone: zPhone10,                                  // formatted accepted, must contain 10 digits
  note: z.string().max(200).optional(),             // short optional message
});

export type InquiryCreateInput = z.infer<typeof zInquiryCreate>;

/* ---------------------------
   Optional: auth helpers
--------------------------- */

export const zUsername = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9._-]+$/, "Only letters, numbers, dot, underscore, dash");

export const zPassword = z
  .string()
  .min(8)
  .max(72) // bcrypt safe
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const zSignUp = z.object({
  username: zUsername,
  password: zPassword,
  email: z.string().email().nullable().optional(),
  role: z.enum(["employer", "talent"]).optional(), // chosen during registration
});
export type SignUpInput = z.infer<typeof zSignUp>;
