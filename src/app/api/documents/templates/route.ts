import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/documents/templates - List all document templates
export async function GET() {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/documents/templates - Create a template (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can manage templates" },
        { status: 403 }
      );
    }

    const { name, serviceType, destinationCountry, isRequired } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.documentTemplate.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const template = await prisma.documentTemplate.create({
      data: {
        name,
        serviceType: serviceType || null,
        destinationCountry: destinationCountry || null,
        isRequired: isRequired ?? true,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/templates - Toggle template required status (admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can manage templates" },
        { status: 403 }
      );
    }

    const { id, isRequired } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const template = await prisma.documentTemplate.update({
      where: { id: Number(id) },
      data: { isRequired },
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}
