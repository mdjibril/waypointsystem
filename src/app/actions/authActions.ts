"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("dummy.supabase.co");
};

export async function signInAction(email: string, password: string) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!dbUser) {
        return { error: "User authenticated in Supabase but not found in local database." };
      }

      return { user: dbUser };
    } else {
      // Mock / Offline mode fallback
      // Check if user exists in the Prisma database
      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!dbUser) {
        return { error: "Invalid credentials (offline mode: user not found in database)." };
      }

      // Simple password check (accepting "password" for the seeded demo users)
      if (password !== "password" && dbUser.passwordHash !== password) {
        return { error: "Invalid password." };
      }

      const cookieStore = await cookies();
      cookieStore.set("mock-auth-user", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return { user: dbUser };
    }
  } catch (err: any) {
    console.error("Sign in action error:", err);
    return { error: err.message || "An unexpected error occurred during sign in." };
  }
}

export async function signOutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("mock-auth-user");

    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }

    return { success: true };
  } catch (err: any) {
    console.error("Sign out action error:", err);
    return { error: err.message || "An unexpected error occurred during sign out." };
  }
}

export async function getCurrentUserAction() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user || !user.email) {
        return { user: null };
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      return { user: dbUser || null };
    } else {
      // Mock / Offline mode fallback
      const cookieStore = await cookies();
      const mockEmail = cookieStore.get("mock-auth-user")?.value;

      if (!mockEmail) {
        return { user: null };
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: mockEmail },
      });

      return { user: dbUser || null };
    }
  } catch (err) {
    console.error("Get current user action error:", err);
    return { user: null };
  }
}
