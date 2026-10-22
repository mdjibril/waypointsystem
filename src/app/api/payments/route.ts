import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { formatAmount } from "@/lib/currency";
import { canConfirmPayment, canRecordPayment, isAdmin } from "@/lib/permissions";

// Payment statuses:
//   PENDING     - money received, awaiting admin confirmation
//   CONFIRMED   - money received and confirmed
//   REJECTED    - payment rejected by an admin
//   OUTSTANDING - a balance the client still owes; `amount` is the remaining balance
//   SETTLED     - an outstanding balance that has been fully paid off (amount 0)
// A payment made towards an outstanding balance is linked to it through its notes.

const paymentInclude = {
  client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
  application: { select: { id: true, serviceType: true, currentStage: true } },
  recordedBy: { select: { id: true, name: true, email: true } },
  confirmedBy: { select: { id: true, name: true, email: true } },
};

const TOWARDS_PREFIX = "Payment towards ";

function towardsNote(invoiceNumber: string, note?: string) {
  return `${TOWARDS_PREFIX}${invoiceNumber}${note ? ` — ${note}` : ""}`;
}

// The invoice number of the outstanding balance a payment was made towards, if any.
function outstandingInvoiceFor(notes: string | null): string | null {
  if (!notes?.startsWith(TOWARDS_PREFIX)) return null;
  return notes.slice(TOWARDS_PREFIX.length).split(" ")[0] || null;
}

// Generate invoice number: INV-YYYY-NNNN. Continue from the highest number used this year
// rather than counting rows, so deleting a payment never causes a duplicate number.
async function nextInvoiceNumber(): Promise<string> {
  const prefix = `INV-${new Date().getFullYear()}-`;
  const existingNumbers = await prisma.payment.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });
  const lastSeq = existingNumbers.reduce((max, p) => {
    const seq = parseInt(p.invoiceNumber.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

// When a payment towards an outstanding balance is rejected or deleted, its amount is owed again.
async function restoreOutstanding(tx: Prisma.TransactionClient, payment: { notes: string | null; amount: number; status: string }) {
  const invoice = outstandingInvoiceFor(payment.notes);
  if (!invoice || payment.status === "REJECTED") return;
  const outstanding = await tx.payment.findUnique({ where: { invoiceNumber: invoice } });
  if (!outstanding || (outstanding.status !== "OUTSTANDING" && outstanding.status !== "SETTLED")) return;
  await tx.payment.update({
    where: { id: outstanding.id },
    data: { amount: outstanding.amount + payment.amount, status: "OUTSTANDING" },
  });
}

// GET /api/payments - List payments (ADMIN: all, STAFF: assigned clients only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ payments: [] });
    }

    const where: any = {};

    if (!isAdmin(currentUser.role)) {
      where.client = {
        assignedStaffId: currentUser.id,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: paymentInclude,
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

// POST /api/payments - Record a payment, an outstanding balance, or a payment towards an
// outstanding balance (ADMIN: any client, STAFF: assigned clients only)
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
      type, // "PAYMENT" (money received) | "OUTSTANDING" (balance the client still owes)
      outstandingId, // set when this payment pays off (part of) an outstanding balance
    } = await request.json();

    if (outstandingId) {
      return await payTowardsOutstanding(currentUser, Number(outstandingId), {
        amount: Number(amount),
        method,
        notes,
        receiptFileName,
        receiptUrl,
      });
    }

    const isOutstanding = type === "OUTSTANDING";

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

    if (!canRecordPayment(currentUser.role, client.assignedStaffId, currentUser.id)) {
      return NextResponse.json(
        { error: "You can only record payments for your assigned clients" },
        { status: 403 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        clientId: Number(clientId),
        applicationId: applicationId ? Number(applicationId) : null,
        invoiceNumber: await nextInvoiceNumber(),
        amount: Number(amount),
        currency,
        method: method || null,
        notes: notes || null,
        receiptFileName: receiptFileName || null,
        receiptUrl: receiptUrl || null,
        status: isOutstanding ? "OUTSTANDING" : "PENDING",
        recordedById: currentUser.id,
      },
      include: paymentInclude,
    });

    await logActivity({
      clientId: payment.clientId,
      entityType: "PAYMENT",
      entityId: payment.id,
      action: isOutstanding ? "OUTSTANDING_RECORDED" : "PAYMENT_RECORDED",
      description: isOutstanding
        ? `Outstanding balance of ${formatAmount(payment.amount, payment.currency)} recorded (Invoice ${payment.invoiceNumber})`
        : `Payment of ${formatAmount(payment.amount, payment.currency)} recorded (Invoice ${payment.invoiceNumber})`,
      actorId: currentUser.id,
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

async function payTowardsOutstanding(
  currentUser: { id: number; role: string },
  outstandingId: number,
  input: { amount: number; method?: string; notes?: string; receiptFileName?: string; receiptUrl?: string | null }
) {
  const outstanding = await prisma.payment.findUnique({
    where: { id: outstandingId },
    include: { client: { select: { assignedStaffId: true } } },
  });
  if (!outstanding || outstanding.status !== "OUTSTANDING") {
    return NextResponse.json(
      { error: "This outstanding balance was not found or is already paid off" },
      { status: 404 }
    );
  }

  if (!canRecordPayment(currentUser.role, outstanding.client.assignedStaffId, currentUser.id)) {
    return NextResponse.json(
      { error: "You can only record payments for your assigned clients" },
      { status: 403 }
    );
  }

  const amount = Math.round(input.amount * 100) / 100;
  if (!(amount > 0) || amount > outstanding.amount + 0.001) {
    return NextResponse.json(
      { error: `Enter an amount between 0 and ${formatAmount(outstanding.amount, outstanding.currency)}` },
      { status: 400 }
    );
  }

  const remaining = Math.max(0, Math.round((outstanding.amount - amount) * 100) / 100);
  const settled = remaining === 0;
  // Admins confirm the payment as they record it; staff payments wait for admin confirmation.
  const confirmNow = canConfirmPayment(currentUser.role);
  const invoiceNumber = await nextInvoiceNumber();

  const [payment, updatedOutstanding] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        clientId: outstanding.clientId,
        applicationId: outstanding.applicationId,
        invoiceNumber,
        amount,
        currency: outstanding.currency,
        method: input.method || null,
        notes: towardsNote(outstanding.invoiceNumber, input.notes?.trim()),
        receiptFileName: input.receiptFileName || null,
        receiptUrl: input.receiptUrl || null,
        status: confirmNow ? "CONFIRMED" : "PENDING",
        confirmedById: confirmNow ? currentUser.id : null,
        recordedById: currentUser.id,
      },
      include: paymentInclude,
    }),
    prisma.payment.update({
      where: { id: outstanding.id },
      data: { amount: remaining, status: settled ? "SETTLED" : "OUTSTANDING" },
      include: paymentInclude,
    }),
  ]);

  await logActivity({
    clientId: outstanding.clientId,
    entityType: "PAYMENT",
    entityId: payment.id,
    action: settled ? "OUTSTANDING_SETTLED" : "OUTSTANDING_PART_PAID",
    description: settled
      ? `Outstanding balance ${outstanding.invoiceNumber} paid off with ${formatAmount(amount, outstanding.currency)} (Invoice ${invoiceNumber})`
      : `${formatAmount(amount, outstanding.currency)} paid towards ${outstanding.invoiceNumber}; ${formatAmount(remaining, outstanding.currency)} still owed (Invoice ${invoiceNumber})`,
    actorId: currentUser.id,
  });

  return NextResponse.json({ payment, outstanding: updatedOutstanding }, { status: 201 });
}

// PATCH /api/payments - Confirm/reject a payment, edit an outstanding balance, or attach a receipt (admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!canConfirmPayment(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can update payments" },
        { status: 403 }
      );
    }

    const { id, status, amount, notes, receiptFileName, receiptUrl } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const previous = await prisma.payment.findUnique({ where: { id: Number(id) } });
    if (!previous) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (status !== undefined && status !== "CONFIRMED" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "Status can only be changed to CONFIRMED or REJECTED" },
        { status: 400 }
      );
    }
    if (status !== undefined && previous.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only payments awaiting confirmation can be confirmed or rejected" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      updateData.confirmedById = currentUser.id;
    }
    if (amount !== undefined) {
      if (previous.status !== "OUTSTANDING") {
        return NextResponse.json(
          { error: "Only an outstanding balance's amount can be edited" },
          { status: 400 }
        );
      }
      if (!(Number(amount) > 0)) {
        return NextResponse.json(
          { error: "Amount must be greater than 0" },
          { status: 400 }
        );
      }
      updateData.amount = Number(amount);
    }
    if (notes !== undefined) updateData.notes = notes || null;
    if (receiptFileName !== undefined) updateData.receiptFileName = receiptFileName || null;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null;

    const payment = await prisma.$transaction(async (tx) => {
      if (status === "REJECTED") await restoreOutstanding(tx, previous);
      return tx.payment.update({
        where: { id: Number(id) },
        data: updateData,
        include: paymentInclude,
      });
    });

    if (status) {
      await logActivity({
        clientId: payment.clientId,
        entityType: "PAYMENT",
        entityId: payment.id,
        action: status === "CONFIRMED" ? "PAYMENT_CONFIRMED" : "PAYMENT_REJECTED",
        description: `Payment of ${formatAmount(payment.amount, payment.currency)} (Invoice ${payment.invoiceNumber}) was ${status === "CONFIRMED" ? "confirmed" : "rejected"}`,
        actorId: currentUser.id,
      });
    } else if (amount !== undefined && Number(amount) !== previous.amount) {
      await logActivity({
        clientId: payment.clientId,
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "OUTSTANDING_UPDATED",
        description: `Outstanding balance ${payment.invoiceNumber} changed from ${formatAmount(previous.amount, previous.currency)} to ${formatAmount(payment.amount, payment.currency)}`,
        actorId: currentUser.id,
      });
    }

    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/payments?id=NN - Delete a payment/receipt record (admin only)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can delete payments" },
        { status: 403 }
      );
    }

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await restoreOutstanding(tx, payment);
      await tx.payment.delete({ where: { id } });
    });

    await logActivity({
      clientId: payment.clientId,
      entityType: "PAYMENT",
      entityId: payment.id,
      action: "PAYMENT_DELETED",
      description: `${payment.status === "OUTSTANDING" || payment.status === "SETTLED" ? "Outstanding balance" : "Payment"} of ${formatAmount(payment.amount, payment.currency)} (Invoice ${payment.invoiceNumber}) was deleted`,
      actorId: currentUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete payment error:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
