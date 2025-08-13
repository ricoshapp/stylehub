// app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type ShiftDaysArray = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

function toShiftDaysJson(arr?: boolean[]): Record<string, boolean> | null {
  if (!Array.isArray(arr) || arr.length !== 7) return null;
  const [sun, mon, tue, wed, thu, fri, sat] = arr.map(Boolean) as ShiftDaysArray;
  return { sun, mon, tue, wed, thu, fri, sat };
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to post a job." }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      title,
      role,
      compModel,
      payMin,
      payMax,
      payUnit,
      payVisible,
      employmentType,
      schedule,
      experienceText,
      shiftDays, // [Sun..Sat] booleans from form
      description,
      startDate,
      location,
      photos,
    } = body || {};

    if (!businessName || !title) {
      return NextResponse.json(
        { error: "Business name and short title are required." },
        { status: 400 }
      );
    }

    // connect existing Location by id or create a new one
    let locationConnect: { connect: { id: string } } | undefined;
    if (location?.id) {
      locationConnect = { connect: { id: String(location.id) } };
    } else {
      const loc = await prisma.location.create({
        data: {
          lat: Number(location?.lat ?? 32.7157),
          lng: Number(location?.lng ?? -117.1611),
          addressLine1: location?.addressLine1 ?? null,
          city: location?.city ?? null,
          county: location?.county ?? "San Diego County",
          state: location?.state ?? "CA",
          postalCode: location?.postalCode ?? null,
          country: location?.country ?? "US",
        },
      });
      locationConnect = { connect: { id: loc.id } };
    }

    const shiftDaysJson = toShiftDaysJson(shiftDays);

    const job = await prisma.job.create({
      data: {
        owner: { connect: { id: user.id } },

        businessName,
        title,
        role,
        compModel,

        // compensation
        payMin: payMin ?? null,
        payMax: payMax ?? null,
        payUnit: payUnit ?? "$/hr",
        payVisible: !!payVisible,

        // schedule/meta
        employmentType: employmentType ?? null,  // keep only if your schema has it
        schedule: schedule ?? null,              // keep only if your schema has it
        experienceText: experienceText ?? null,
        shiftDaysJson,                           // matches your schema’s JSON field

        // content
        description: description ?? "",
        startDate: startDate ? new Date(startDate) : null,

        // relations
        location: locationConnect,
        photos:
          Array.isArray(photos) && photos.length
            ? {
                create: photos.map((p: any, i: number) => ({
                  url: typeof p === "string" ? p : p.url,
                  sortOrder: i,
                })),
              }
            : undefined,
      },
      include: { location: true, photos: true },
    });

    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
