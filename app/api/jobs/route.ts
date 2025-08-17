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

// Decode dataURL -> { mime, data(Buffer) } — (we’re just storing raw DataURL for now)
function isDataUrl(s: string) {
  return /^data:image\/[a-zA-Z]+;base64,/.test(s);
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: "Not signed in" }, { status: 401 });

    const body = await req.json();

    // NOTE: your zod schema may still require fields. We’ll coerce/allow nullables here.
    const parsed = zJobCreate
      .extend({
        // allow nullables for comp fields explicitly, if your schema was stricter
        payMin: zJobCreate.shape.payMin.nullable().optional(),
        payMax: zJobCreate.shape.payMax.nullable().optional(),
        employmentType: zJobCreate.shape.employmentType.nullable().optional(),
        schedule: zJobCreate.shape.schedule.nullable().optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create or reuse Location
    let locationId: string | undefined = undefined;
    if (data.location) {
      const loc = await prisma.location.create({
        data: {
          lat: data.location.lat,
          lng: data.location.lng,
          addressLine1: data.location.address || data.location.addressLine1 || "",
          city: data.location.city || "",
          state: data.location.state || "CA",
          postalCode: data.location.postalCode || "",
          country: data.location.country || "US",
          // county is optional in your schema; add if present
          ...(!!(data as any).location.county ? { county: (data as any).location.county } : {}),
        },
        select: { id: true },
      });
      locationId = loc.id;
    }

    // Ensure employer profile
    const employerProfileId = await ensureEmployerProfile(me.id, data.businessName, locationId);

    // Derive expiresAt (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create job
    const job = await prisma.job.create({
      data: {
        employerProfile: { connect: { id: employerProfileId } },
        businessName: data.businessName,
        title: data.title,
        role: data.role,
        compModel: data.compModel,
        payMin: data.payMin ?? null,
        payMax: data.payMax ?? null,
        payUnit: data.payUnit || "",
        payVisible: !!data.payVisible,
        employmentType: data.employmentType ?? null,
        schedule: data.schedule ?? null, // we pass "any" as literal or null; listing renders it
        experienceText: data.experienceText ?? null,
        description: data.description || "",
        startDate: null,
        ...(locationId ? { location: { connect: { id: locationId } } } : {}),
        expiresAt,
        // photos created below
      },
      select: { id: true },
    });

    // Store first image as a JobPhoto with `url` = DataURL (or external URL if provided)
    if (Array.isArray(data.photos) && data.photos.length > 0) {
      const filtered = data.photos.filter((p) => typeof p === "string" && p.length > 0);
      if (filtered.length) {
        await prisma.jobPhoto.createMany({
          data: filtered.map((p, idx) => ({
            jobId: job.id,
            url: p, // DataURL for now; later we’ll swap to storage URLs
            order: idx,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true, id: job.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to create job", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
