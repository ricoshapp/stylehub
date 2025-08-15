// components/EmployerManageLink.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function EmployerManageLink() {
  const me = await getCurrentUser();
  if (!me) return null;

  // Only show if active role is employer
  const role = cookies().get("sh_role")?.value;
  if (role !== "employer") return null;

  // And only if they *actually* have an employer profile
  const employer = await prisma.employerProfile.findFirst({
    where: { userId: me.id },
    select: { id: true },
  });
  if (!employer) return null;

  return (
    <Link href="/jobs/manage" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
      Manage
    </Link>
  );
}
