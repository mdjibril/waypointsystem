import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/payments - List payments (ADMIN: all, STAFF: assigned clients only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ payments: [] });
    }

    const where: any = {};

    if (currentUser.role !== "ADMIN") {
      where.client = {
        assignedStaffId: currentUser.id,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Fetch payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments - Record a payment/invoice (ADMIN: any client, STAFF: assigned clients only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      clientId,
      applicationId,
      amount,
      currency,
      method,
      notes,
      receiptFileName,
      receiptUrl,
    } = await request.json();

    if (!clientId || !amount || !currency) {
      return NextResponse.json(
        { error: "Client, amount, and currency are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({ where: { id: Number(clientId) } });
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (currentUser.role !== "ADMIN" && client.assignedStaffId !== currentUser.id) {
      return NextResponse.json(
        { error: "You can only record payments for your assigned clients" },
        { status: 403 }
      );
    }

    // Generate invoice number: INV-YYYY-NNNN
    const year = new Date().getFullYear();
    const count = await prisma.payment.count();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    const payment = await prisma.payment.create({
      data: {
        clientId: Number(clientId),
        applicationId: applicationId ? Number(applicationId) : null,
        invoiceNumber,
        amount: Number(amount),
        currency,
        method: method || null,
        notes: notes || null,
        receiptFileName: receiptFileName || null,
        receiptUrl: receiptUrl || null,
        recordedById: currentUser.id,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

// PATCH /api/payments - Confirm/reject a payment, or attach a receipt (admin only)
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
        { error: "Only administrators can confirm payments" },
        { status: 403 }
      );
    }

    const { id, status, notes, receiptFileName, receiptUrl } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;
    if (receiptFileName !== undefined) updateData.receiptFileName = receiptFileName || null;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null;

    if (status === "CONFIRMED" || status === "REJECTED") {
      updateData.confirmedById = currentUser.id;
    }

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
        confirmedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
