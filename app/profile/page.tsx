// app/profile/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RoleSwitcher from "@/components/RoleSwitcher";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");

  // Read the role view from cookie set by RoleSwitcher.
  // If missing, fall back to the user's stored role or "talent".
  const c = cookies();
  const roleView =
    (c.get("roleView")?.value as "talent" | "employer" | undefined) ||
    ((me as any).role ?? "talent");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div>
        <p className="text-sm mb-2">Use StyleHub as</p>
        <RoleSwitcher />
      </div>

      <ProfileClient
        me={{
          id: me.id,
          name: me.name ?? "",
          role: roleView, // << use cookie role view here
        }}
      />
    </div>
  );
}
