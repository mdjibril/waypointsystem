import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// A persistent cookie: without maxAge, mobile browsers drop the session cookie when
// the app is closed while the client still thinks the user is signed in (localStorage).
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies();
  const mockEmail = cookieStore.get("mock-auth-user")?.value;
  if (!mockEmail) return null;

  const user = await prisma.user.findUnique({
    where: { email: mockEmail },
  });
  if (user) {
    user.role = user.role.toUpperCase();
  }
  return user;
}
