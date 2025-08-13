import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const userEmp = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: { email: "owner@example.com", name: "Demo Owner", roles: ["employer"] },
  });

  const userTal = await prisma.user.upsert({
    where: { email: "talent@example.com" },
    update: {},
    create: { email: "talent@example.com", name: "Demo Talent", roles: ["talent"] },
  });

  const shop = await prisma.employerProfile.create({
    data: { userId: userEmp.id, shopName: "American Deluxe (Demo)" },
  });

  const loc = await prisma.location.create({
    data: { addressLine1: "100 Demo Ave", city: "San Diego", state: "CA", postalCode: "92101", lat: 32.7157, lng: -117.1611 }
  });

  const job1 = await prisma.job.create({
    data: {
      employerProfileId: shop.id,
      locationId: loc.id,
      title: "Experienced Barber",
      role: "barber",
      compModel: "hourly",
      payMin: 22,
      payMax: 30,
      payUnit: "$/hr",
      payVisible: true,
      employmentType: "w2",
      schedule: "full_time",
      shiftDays: [true,true,true,true,true,false,false],
      description: "Busy shop in downtown SD. Tools provided, walk-ins daily.",
      perks: ["Walk-ins provided","Tools provided","Great team"],
      photos: { create: [{ url: "/placeholder.jpg", sortOrder: 0 }] }
    }
  });

  await prisma.talentProfile.upsert({
    where: { userId: userTal.id },
    update: {},
    create: { userId: userTal.id, roles: ["barber"], availabilityDays: [true,true,true,true,true,false,false], zipCode: "92109", travelRadiusMiles: 15 }
  });

  console.log("Seeded:", { job1: job1.id });
}

main().finally(() => prisma.$disconnect());
