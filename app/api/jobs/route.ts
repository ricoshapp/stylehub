// app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

/** ---------- zod shape (kept minimal + compatible with your client) ---------- */
const zLocation = z.object({
  lat: z.number(),
  lng: z.number(),
  addressLine1: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

const zJobCreate = z.object({
  businessName: z.string().min(1, "Business name required"),
  title: z.string().min(1).max(60),       // short title capped per your request
  role: z.enum([
    "barber",
    "cosmetologist",
    "tattoo_artist",
    // leave other roles out since you asked to restrict UI to these 3
  ]),
  compModel: z.enum(["booth_rent", "commission", "hourly", "hybrid"]),
  payMin: z.number().int().nonnegative().nullable().optional(),
  payMax: z.number().int().nonnegative().nullable().optional(),
  payUnit: z.string(),                    // "$/hr", "$/wk", etc.
  payVisible: z.boolean(),
  employmentType: z.enum(["w2", "c1099"]).nullable().optional(),
  schedule: z.enum(["full_time", "part_time"]).nullable().optional(),
  experienceText: z.string().max(20).nullable().optional(), // 20 chars max
  description: z.string().max(200).optional().default(""),
  // we collapsed shiftDays in your schema — if you still have it, add here
  location: zLocation,
  photos: z.array(z.string()).max(6).optional().default([]), // data URLs from client
});

/** ---------- helpers ---------- */
function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  // default jpg for jpeg & unknowns
  return "jpg";
}

/** Save a data URL (data:image/...;base64,XXXX) into /public/uploads, return web path */
async function saveDataUrl(dataUrl: string): Promise<string> {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL");
  const mime = m[1];
  const b64 = m[2];
  const buf = Buffer.from(b64, "base64");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const name = `${Date.now()}-${(crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2)}.${extFromMime(mime)}`;
  const abs = path.join(uploadsDir, name);
  await fs.writeFile(abs, buf);

  // web-accessible path
  return `/uploads/${name}`;
}

/** Create or reuse employer profile for user (ties job to shop) */
async function getOrCreateEmployerProfile(userId: string, shopName: string, locationId: string) {
  const existing = await prisma.employerProfile.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.employerProfile.create({
    data: {
      user: { connect: { id: userId } },
      shopName,
      location: { connect: { id: locationId } },
    },
    select: { id: true },
  });
  return created.id;
}

/** ---------- POST /api/jobs (create) ---------- */
export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = zJobCreate.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 1) Location (create new each post; safe + simple)
    const loc = await prisma.location.create({
      data: {
        lat: data.location.lat,
        lng: data.location.lng,
        addressLine1: data.location.addressLine1 ?? null,
        city: data.location.city ?? null,
        state: data.location.state ?? null,
        postalCode: data.location.postalCode ?? null,
        country: data.location.country ?? "US",
      },
      select: { id: true },
    });

    // 2) Ensure employer profile exists for this user
    const employerProfileId = await getOrCreateEmployerProfile(me.id, data.businessName, loc.id);

    // 3) Save photos (if any) to /public/uploads and prep nested create
    const urls: string[] = [];
    for (const d of data.photos ?? []) {
      try {
        urls.push(await saveDataUrl(d));
      } catch {
        // ignore image failures individually to avoid failing entire post
      }
    }

    // 4) Create job + nested photos
    const created = await prisma.job.create({
      data: {
        employerProfile: { connect: { id: employerProfileId } },
        businessName: data.businessName,
        title: data.title,
        role: data.role,
        compModel: data.compModel,
        payMin: data.payMin ?? null,
        payMax: data.payMax ?? null,
        payUnit: data.payUnit,
        payVisible: data.payVisible,
        employmentType: data.employmentType ?? null,
        schedule: data.schedule ?? null,
        experienceText: (data.experienceText ?? null) || null,
        description: data.description ?? "",
        location: { connect: { id: loc.id } },
        imagesCount: urls.length,
        // optional: status defaults in schema; views/inquiries default 0 in schema
        photos: urls.length
          ? {
              create: urls.map((u) => ({ url: u })),
            }
          : undefined,
      },
      include: {
        location: true,
        photos: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      {
        message: "Failed to create job",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

/** ---------- GET /api/jobs (simple list for debugging; your page queries Prisma directly) ---------- */
export async function GET() {
  const rows = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { location: true, photos: true },
  });
  return NextResponse.json(rows);
}
