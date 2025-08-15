// app/profile/page.tsx
import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";
import RoleSwitcher from "@/components/RoleSwitcher";

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Active-role switcher (Talent/Employer) */}
      <RoleSwitcher />

      {/* Your existing profile UI */}
      <ProfileClient
        me={{ id: me.id, name: me.name ?? "", role: (me as any).role }}
      />
    </div>
  );
}
