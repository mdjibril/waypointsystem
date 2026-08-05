import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ error: "Please enter a file number or email" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { fileNumber: { equals: q, mode: "insensitive" } },
          { email: { equals: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fileNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        applications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serviceType: true,
            destinationCountry: true,
            currentStage: true,
            status: true,
            decisionStatus: true,
            createdAt: true,
            stageHistory: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                toStage: true,
                fromStage: true,
                note: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "No client found matching that file number or email." }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error("Client portal lookup error:", error);
    return NextResponse.json({ error: "Failed to look up client" }, { status: 500 });
  }
}
