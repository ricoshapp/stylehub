// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import AuthLinks from "@/components/AuthLinks";
import EmployerManageLink from "@/components/EmployerManageLink";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StyleHub",
  description:
    "Connecting local beauty & body-art talent with shops — San Diego",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen`}>
        {/* Sticky header stays above maps */}
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <nav className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              StyleHub
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/jobs" className="hover:text-white/90">Jobs</Link>
              <Link href="/post" className="hover:text-white/90">Post a Job</Link>
              <Link href="/inbox" className="hover:text-white/90">Inbox</Link>
              <Link href="/profile" className="hover:text-white/90">Profile</Link>
              <Link href="/EmployerManageLink" className="hover:text-white/90">Manage</Link>
              <AuthLinks />
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-400">
          © {new Date().getFullYear()} StyleHub — San Diego
        </footer>
      </body>
    </html>
  );
}
