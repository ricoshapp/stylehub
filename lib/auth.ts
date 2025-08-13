// lib/auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "./db";

export const AUTH_COOKIE = "sh_token";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type TokenPayload = {
  sub: string; // userId
  email: string;
  role: "employer" | "talent";
};

export async function signAuthToken(payload: TokenPayload) {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  if (!payload?.sub) return null;
  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
