import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/clients - List clients (ADMIN: all, non-ADMIN: assigned only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ clients: [] });
    }

    const where: any = {};

    if (currentUser.role !== "ADMIN") {
      where.assignedStaffId = currentUser.id;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error("Fetch clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can create clients" },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      passportNumber,
      dateOfBirth,
      source,
      createdById,
      assignedStaffId,
    } = await request.json();

    if (!firstName || !lastName || !email || !phone || !source || !createdById) {
      return NextResponse.json(
        { error: "First name, last name, email, phone, source, and createdById are required" },
        { status: 400 }
      );
    }

    // Generate file number: WP-YYYY-NNNN
    const year = new Date().getFullYear();
    const count = await prisma.client.count();
    const fileNumber = `WP-${year}-${String(count + 1).padStart(4, "0")}`;

    const newClient = await prisma.client.create({
      data: {
        fileNumber,
        firstName,
        lastName,
        email,
        phone,
        address: address || null,
        passportNumber: passportNumber || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        source,
        createdById,
        assignedStaffId: assignedStaffId || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients - Update a client (admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can update clients" },
        { status: 403 }
      );
    }

    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      address,
      passportNumber,
      dateOfBirth,
      source,
      assignedStaffId,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address || null;
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (source !== undefined) updateData.source = source;
    if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId || null;

    const updatedClient = await prisma.client.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ client: updatedClient });
  } catch (error: any) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}
