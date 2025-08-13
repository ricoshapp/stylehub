// app/inbox/page.tsx
import { getCurrentUser } from "@/lib/auth";
import InboxClient from "./client";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { threadKey?: string };
}) {
  const me = await getCurrentUser();
  const initialThreadKey = searchParams?.threadKey ?? null;
  return (
    <InboxClient
      me={me ? { id: me.id, name: me.name, role: me.role as any } : null}
      initialThreadKey={initialThreadKey}
    />
  );
}
