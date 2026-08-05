import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/applications/[id]/document-requirements — Get per-app checklist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = Number(id);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (currentUser.role !== "ADMIN" && application.client.assignedStaffId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requirements = await prisma.applicationDocumentRequirement.findMany({
      where: { applicationId },
      include: {
        documentTemplate: {
          select: { id: true, name: true, serviceType: true, isRequired: true, sortOrder: true },
        },
      },
      orderBy: { documentTemplate: { sortOrder: "asc" } },
    });

    return NextResponse.json({ requirements });
  } catch (error: any) {
    console.error("Fetch document requirements error:", error);
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

// POST /api/applications/[id]/document-requirements — Add a requirement
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = Number(id);
    const { documentTemplateId } = await request.json();

    if (!documentTemplateId) {
      return NextResponse.json({ error: "documentTemplateId is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (currentUser.role !== "ADMIN" && application.client.assignedStaffId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.applicationDocumentRequirement.findFirst({
      where: { applicationId, documentTemplateId },
    });

    if (existing) {
      return NextResponse.json({ error: "Requirement already exists" }, { status: 409 });
    }

    const requirement = await prisma.applicationDocumentRequirement.create({
      data: { applicationId, documentTemplateId, isRequired: true },
      include: {
        documentTemplate: {
          select: { id: true, name: true, serviceType: true, isRequired: true, sortOrder: true },
        },
      },
    });

    return NextResponse.json({ requirement }, { status: 201 });
  } catch (error: any) {
    console.error("Add document requirement error:", error);
    return NextResponse.json({ error: "Failed to add requirement" }, { status: 500 });
  }
}

// DELETE /api/applications/[id]/document-requirements?requirementId=X
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = Number(id);
    const { searchParams } = new URL(request.url);
    const requirementId = searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json({ error: "requirementId is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (currentUser.role !== "ADMIN" && application.client.assignedStaffId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.applicationDocumentRequirement.delete({
      where: { id: Number(requirementId) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Remove document requirement error:", error);
    return NextResponse.json({ error: "Failed to remove requirement" }, { status: 500 });
  }
}
