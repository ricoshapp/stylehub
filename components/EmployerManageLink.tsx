// components/EmployerManageLink.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function EmployerManageLink() {
  const me = await getCurrentUser();
  if (!me) return null;

  const [employer, talent] = await Promise.all([
    prisma.employerProfile.findFirst({ where: { userId: me.id }, select: { id: true } }),
    prisma.talentProfile.findFirst({ where: { userId: me.id }, select: { id: true } }),
  ]);

  // Show ONLY if user is employer and NOT talent
  if (!employer || talent) return null;

  return (
    <Link
      href="/jobs/manage"
      className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
    >
      Manage
    </Link>
  );
}
