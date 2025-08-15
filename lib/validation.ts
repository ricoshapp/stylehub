import { z } from "zod";

/* ---------- Shared helpers ---------- */
const zPhone10 = z.string().regex(/^\d{10}$/, "Phone must be 10 digits");

/* ---------- Location ---------- */
export const zLocation = z.object({
  lat: z.number(),
  lng: z.number(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  // If your Prisma Location model includes county, keep this; otherwise remove it:
  county: z.string().nullable().optional(),
});

/* ---------- Job Create ---------- */
export const zJobCreate = z.object({
  businessName: z.string().min(1, "Business name is required"),
  title: z.string().min(1).max(60),
  role: z.enum([
    "barber",
    "cosmetologist",
    "esthetician",
    "nail_tech",
    "lash_tech",
    "tattoo_artist",
    "piercer",
  ]),
  compModel: z.enum(["booth_rent", "commission", "hourly", "hybrid"]),

  // Integers only when present, but allow null/omitted
  payMin: z.number().int().nonnegative().nullable().optional(),
  payMax: z.number().int().nonnegative().nullable().optional(),

  payUnit: z.string(), // "$/hr", "$/d", "% & $/hr", etc.
  payVisible: z.boolean(),

  // Allow null/omitted
  employmentType: z.enum(["w2", "c1099"]).nullable().optional(),
  // If you support "any" in UI, include it here:
  schedule: z.enum(["full_time", "part_time", "any"]).nullable().optional(),

  experienceText: z.string().max(20).optional(),

  // Either old array shape or new json shape; both optional
  shiftDays: z.array(z.boolean()).length(7).optional(),
  shiftDaysJson: z
    .object({
      sun: z.boolean(),
      mon: z.boolean(),
      tue: z.boolean(),
      wed: z.boolean(),
      thu: z.boolean(),
      fri: z.boolean(),
      sat: z.boolean(),
    })
    .optional(),

  description: z.string().max(200).nullable().optional(),
  startDate: z.string().nullable().optional(),

  location: zLocation,

  photos: z.array(z.string()).max(6).optional(),
});

/* ---------- Inquiry Create (Send Inquiry modal) ---------- */
export const zInquiryCreate = z.object({
  jobId: z.string().min(1, "jobId required"),
  name: z.string().min(1, "Name required").max(25, "Max 25 characters"),
  phone: zPhone10,
  note: z.string().max(200).nullable().optional(),
});
