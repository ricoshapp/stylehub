// lib/validation.ts (only the important bits shown)
import { z } from "zod";

export const zLocation = z.object({
  lat: z.number(),
  lng: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().nullable().optional(),
  address: z.string().optional(),
});

export const zJobCreate = z.object({
  businessName: z.string().min(1),
  title: z.string().min(1).max(120),      // <-- cap short title
  role: z.enum(["barber","cosmetologist","esthetician","nail_tech","lash_tech","tattoo_artist","piercer"]),
  compModel: z.enum(["booth_rent","commission","hourly","hybrid"]),
  payMin: z.number().int().nonnegative().optional(),
  payMax: z.number().int().nonnegative().optional(),
  payUnit: z.string(),
  payVisible: z.boolean(),
  employmentType: z.enum(["w2","c1099"]).optional(),
  schedule: z.enum(["full_time","part_time"]).optional(),
  experienceText: z.string().max(60).optional(),
  shiftDays: z.array(z.boolean()).length(7).optional(),
  licenses: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  apprenticeFriendly: z.boolean().optional(),
  description: z.string().max(200).optional(),  // <-- cap description
  location: zLocation,
  photos: z.array(z.string()).max(6).optional(),
});

export const zInquiryCreate = z.object({
  jobId: z.string().min(1, "jobId required"),
  note: z.string().max(500).optional(),
});