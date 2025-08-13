// app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const businessName = String(body?.businessName || "").trim();
    const title = String(body?.title || "").trim();
    if (!businessName) return NextResponse.json({ error: "Business name required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const loc = body?.location ?? {};
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") {
      return NextResponse.json({ error: "Location lat/lng required" }, { status: 400 });
    }

    const created = await prisma.job.create({
      data: {
        ownerId: me.id, // tie to current user
        businessName,
        title,
        role: body?.role,
        compModel: body?.compModel,
        payMin: body?.payMin ?? null,
        payMax: body?.payMax ?? null,
        payUnit: body?.payUnit || "$/hr",
        payVisible: !!body?.payVisible,
        employmentType: body?.employmentType ?? null,
        schedule: body?.schedule ?? null,
        experienceText: body?.experienceText ?? null,
        shiftDaysJson: Array.isArray(body?.shiftDays) ? body.shiftDays : [false,false,false,false,false,false,false],
        apprenticeFriendly: !!body?.apprenticeFriendly,
        perks: Array.isArray(body?.perks) ? body.perks : [],
        description: body?.description || "",
        location: {
          create: {
            lat: loc.lat,
            lng: loc.lng,
            addressLine1: loc.addressLine1 ?? null,
            addressLine2: null,
            city: loc.city ?? null,
            county: loc.county ?? "San Diego County",
            state: loc.state ?? "CA",
            postalCode: loc.postalCode ?? null,
            country: loc.country ?? "US",
          },
        },
        photos: {
          create: Array.isArray(body?.photos) && body.photos.length
            ? body.photos.map((u: string, i: number) => ({ url: u, sortOrder: i }))
            : [{ url: "/placeholder.jpg", sortOrder: 0 }],
        },
      },
      include: { location: true, photos: true },
    });

    return NextResponse.json({ ok: true, job: created });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to create job", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
