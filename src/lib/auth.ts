import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
