// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Demo owner (employer)
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { role: "employer", name: "Demo Owner" },
    create: { email: "owner@example.com", name: "Demo Owner", role: "employer" },
  });

  const sd = { city: "San Diego", county: "San Diego County", state: "CA", country: "US" };

  const jobs = [
    {
      businessName: "Fade Factory",
      title: "Chair available — walk-ins, great foot traffic",
      role: "barber",
      compModel: "hourly",
      payMin: 25,
      payUnit: "$/hr",
      payVisible: true,
      employmentType: "w2",
      schedule: "full_time",
      shiftDaysJson: [false, true, true, true, true, true, false],
      experienceText: "2+ yrs fades",
      description: "Modern shop, tools provided. Start ASAP.",
      lat: 32.7157, lng: -117.1611,
    },
    {
      businessName: "Luna Ink Studio",
      title: "Tattoo artist booth — clientele a plus",
      role: "tattoo_artist",
      compModel: "booth_rent",
      payMin: 300, // $/wk by default in our storage
      payUnit: "$/wk",
      payVisible: true,
      employmentType: "c1099",
      schedule: "part_time",
      shiftDaysJson: [true, false, true, false, true, false, true],
      experienceText: "Portfolio required",
      description: "Clean private rooms, walk-ins on weekends.",
      lat: 32.7490, lng: -117.1290,
    },
    {
      businessName: "Coastal Esthetics",
      title: "Esthetician — hybrid comp",
      role: "esthetician",
      compModel: "hybrid",
      payMin: 40,   // commission (shop %)
      payMax: 20,   // wage ($/hr)
      payUnit: "$/hr",
      payVisible: true,
      employmentType: "w2",
      schedule: "full_time",
      shiftDaysJson: [false, true, true, true, true, false, false],
      experienceText: "1–2 yrs facials",
      description: "Great team, steady bookings.",
      lat: 32.8031, lng: -117.2440,
    },
    {
      businessName: "Nail Haus",
      title: "Nail tech — commission",
      role: "nail_tech",
      compModel: "commission",
      payMin: 50,   // commission (shop %)
      payUnit: "%",
      payVisible: false,
      employmentType: "c1099",
      schedule: "part_time",
      shiftDaysJson: [true, true, false, false, true, true, false],
      experienceText: "Gel/X, designs",
      description: "Busy weekends. Supplies available.",
      lat: 32.715, lng: -117.15,
    },
    {
      businessName: "Pierce Point",
      title: "Piercer — hourly",
      role: "piercer",
      compModel: "hourly",
      payMin: 22,
      payUnit: "$/hr",
      payVisible: true,
      employmentType: "w2",
      schedule: "full_time",
      shiftDaysJson: [false, true, true, true, true, true, false],
      experienceText: "Apprentice-friendly",
      description: "Full sterilization setup. Walk-ins daily.",
      lat: 32.72, lng: -117.18,
    },
  ];

  for (const j of jobs) {
    await prisma.job.create({
      data: {
        ownerId: owner.id,
        businessName: j.businessName,
        title: j.title,
        role: j.role,
        compModel: j.compModel,
        payMin: j.payMin ?? null,
        payMax: j.payMax ?? null,
        payUnit: j.payUnit,
        payVisible: j.payVisible,
        employmentType: j.employmentType,
        schedule: j.schedule,
        shiftDaysJson: j.shiftDaysJson,
        experienceText: j.experienceText,
        description: j.description,
        location: {
          create: {
            lat: j.lat,
            lng: j.lng,
            addressLine1: null,
            addressLine2: null,
            ...sd,
            postalCode: null,
          },
        },
        photos: {
          create: [{ url: "/placeholder.jpg", sortOrder: 0 }],
        },
      },
    });
  }

  console.log("Seeded demo user + jobs.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
