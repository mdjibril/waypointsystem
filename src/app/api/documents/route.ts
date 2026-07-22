import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/documents - List documents (ADMIN: all, STAFF: assigned clients only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ documents: [] });
    }

    const where: any = {};

    if (currentUser.role !== "ADMIN") {
      where.client = {
        assignedStaffId: currentUser.id,
      };
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a document record
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
      documentType,
      fileName,
      fileUrl,
    } = await request.json();

    if (!documentType || !fileName) {
      return NextResponse.json(
        { error: "Document type and file name are required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        clientId: clientId ? Number(clientId) : null,
        applicationId: applicationId ? Number(applicationId) : null,
        documentType,
        fileName,
        fileUrl: fileUrl || null,
        uploadedById: currentUser.id,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: any) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents - Update document verification status
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
        { error: "Only administrators can verify documents" },
        { status: 403 }
      );
    }

    const { id, status, verificationNotes } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (verificationNotes !== undefined) updateData.verificationNotes = verificationNotes || null;

    if (status === "VERIFIED" || status === "REJECTED") {
      updateData.verifiedById = currentUser.id;
    }

    const document = await prisma.document.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
