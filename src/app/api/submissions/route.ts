import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const submission = await prisma.submissionRecord.findUnique({
      where: { applicationId: Number(applicationId) },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ submission });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { applicationId, referenceNumber, submittedAt, biometricsAt, portal, notes } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const submission = await prisma.submissionRecord.upsert({
      where: { applicationId: Number(applicationId) },
      create: {
        applicationId: Number(applicationId),
        referenceNumber: referenceNumber || null,
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        biometricsAt: biometricsAt ? new Date(biometricsAt) : null,
        portal: portal || null,
        notes: notes || null,
        submittedById: currentUser.id,
      },
      update: {
        referenceNumber: referenceNumber || null,
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        biometricsAt: biometricsAt ? new Date(biometricsAt) : null,
        portal: portal || null,
        notes: notes || null,
        submittedById: currentUser.id,
      },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
