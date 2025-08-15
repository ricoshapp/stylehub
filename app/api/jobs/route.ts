// app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { zJobCreate } from "@/lib/validation";

/** Ensure the current user has an EmployerProfile; create minimal one if missing. */
async function ensureEmployerProfile(ownerId: string, shopName: string, locationId?: string) {
  const existing = await prisma.employerProfile.findFirst({
    where: { userId: ownerId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.employerProfile.create({
    data: {
      user: { connect: { id: ownerId } },
      shopName: shopName || "My Shop",
      ...(locationId ? { location: { connect: { id: locationId } } } : {}),
    },
    select: { id: true },
  });
  return created.id;
}

/** Normalize shift days into a 7-bool array [sun..sat]. */
function toShiftDaysArray(input: any): boolean[] {
  // already an array?
  if (Array.isArray(input) && input.length === 7) {
    return input.map(Boolean);
  }
  // object shape { sun..sat }
  if (
    input &&
    typeof input === "object" &&
    ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].every((k) => typeof input[k] === "boolean")
  ) {
    const { sun, mon, tue, wed, thu, fri, sat } = input as Record<string, boolean>;
    return [sun, mon, tue, wed, thu, fri, sat];
  }
  // default: all false
  return [false, false, false, false, false, false, false];
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = zJobCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Location: connect by id or create from inline
    let locationId: string | undefined;
    if ((data as any).locationId) {
      locationId = (data as any).locationId as string;
    } else if (data.location && (data.location as any).id) {
      locationId = (data.location as any).id as string;
    } else if (data.location) {
      const loc = await prisma.location.create({
        data: {
          lat: data.location.lat,
          lng: data.location.lng,
          addressLine1: (data.location as any).addressLine1 ?? null,
          addressLine2: (data.location as any).addressLine2 ?? null,
          city: data.location.city ?? null,
          state: (data.location.state || "CA") as string,
          postalCode: data.location.postalCode ?? null,
          country: (data.location.country || "US") as string,
          // your schema has county String? — include when provided (often "San Diego County")
          county: (data.location as any).county ?? null,
        },
        select: { id: true },
      });
      locationId = loc.id;
    }

    // Ensure employer profile exists for this user
    const employerProfileId = await ensureEmployerProfile(me.id, data.businessName, locationId);

    // Normalize shift days to boolean[]
    const shiftDaysArr = toShiftDaysArray((data as any).shiftDays ?? (data as any).shiftDaysJson);

    // Optional photos (accept data URLs or http urls)
    const photosCreate =
      Array.isArray(data.photos) && data.photos.length
        ? {
            create: data.photos
              .filter((u) => typeof u === "string" && u.length <= 2_000_000) // basic guard
              .map((url) => ({ url })),
          }
        : undefined;

    const job = await prisma.job.create({
      data: {
        // NOTE: no `owner` field here (schema doesn’t have it)
        employerProfile: { connect: { id: employerProfileId } },

        businessName: data.businessName?.trim() || null,
        title: data.title,
        role: data.role,
        compModel: data.compModel,

        payMin: data.payMin ?? null,
        payMax: data.payMax ?? null,
        payUnit: data.payUnit,
        payVisible: data.payVisible,

        employmentType: data.employmentType ?? null,
        schedule: data.schedule ?? null,
        experienceText: data.experienceText ?? null,

        shiftDays: shiftDaysArr, // use the Boolean[] column
        description: data.description ?? "",
        startDate: (data.startDate as any) ?? null,

        ...(locationId ? { location: { connect: { id: locationId } } } : {}),
        photos: photosCreate,
      },
      include: { location: true, photos: true },
    });

    return NextResponse.json({ message: "OK", job }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to create job", detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: { location: true, photos: true },
    });
    return NextResponse.json({ items: jobs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Failed to list jobs", detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}
