// app/profile/page.tsx
import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./profile-client";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/signin");
  return <ProfileClient me={{ id: me.id, name: me.name ?? "", role: me.role as any }} />;
}
