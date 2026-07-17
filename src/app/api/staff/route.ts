import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET /api/staff - List all staff members
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Remove password hashes from response
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    
    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    console.error("Fetch staff error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff members" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: Request) {
  try {
    const { name, email, phone, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Default password is password123
    const passwordHash = await bcrypt.hash("password123", 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role.toLowerCase(),
        status: "active",
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error: any) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

// PATCH /api/staff - Update a staff member
export async function PATCH(request: Request) {
  try {
    const { userId, name, phone, role, status, password } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role.toLowerCase();
    if (status !== undefined) updateData.status = status;
    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;

    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}
