"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStaffUsersAction() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { users };
  } catch (err: any) {
    console.error("Failed to fetch staff users:", err);
    return { error: err.message || "Failed to fetch staff members." };
  }
}

export async function createStaffUserAction(data: {
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "STAFF";
}) {
  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { error: "A user with this email address already exists." };
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role.toLowerCase(), // Store as lowercase in db
        status: "active",
        passwordHash: "password", // default password
      },
    });

    revalidatePath("/");
    return { user: newUser };
  } catch (err: any) {
    console.error("Failed to create staff user:", err);
    return { error: err.message || "Failed to create staff member." };
  }
}

export async function updateStaffUserAction(
  userId: number,
  data: {
    name?: string;
    phone?: string;
    role?: "ADMIN" | "STAFF";
    status?: "active" | "inactive";
    passwordHash?: string;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.role) {
      updateData.role = data.role.toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/");
    return { user: updatedUser };
  } catch (err: any) {
    console.error("Failed to update staff user:", err);
    return { error: err.message || "Failed to update staff member." };
  }
}
