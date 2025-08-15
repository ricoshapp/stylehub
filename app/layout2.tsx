// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import EmployerManageLink from "@/components/EmployerManageLink";

export const metadata = {
  title: "StyleHub",
  description: "Connecting talent",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            {/* Logo / Home */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight">StyleHub</span>
              <span className="text-xs text-white/60">connecting talent</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              <Link href="/jobs" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                Jobs
              </Link>
              <Link href="/post" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                Post
              </Link>
              <Link href="/inbox" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                Inquiries
              </Link>

              {/* Only shows if the user has an EmployerProfile */}
              <EmployerManageLink />

              {user ? (
                <Link href="/profile" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                  Profile
                </Link>
              ) : (
                <>
                  <Link href="/signin" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                    Sign in
                  </Link>
                  <Link href="/signup" className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
