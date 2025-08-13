// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 8 MB limit for MVP
  if (buffer.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (8MB max)" }, { status: 413 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(uploadsDir, name);

  await writeFile(filepath, buffer);
  return NextResponse.json({ url: `/uploads/${name}` });
}
