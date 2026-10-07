import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/daily-reports?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const isAdmin = user.role.toUpperCase() === "ADMIN";

    const reports = await prisma.dailyReport.findMany({
      where: {
        date,
        ...(isAdmin ? {} : { staffId: user.id }),
        // Staff only see their own; admins see all for that date
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("GET /api/daily-reports error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/daily-reports  – create or update (upsert) a report
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      date,
      department,
      position,
      reportingTime,
      closingTime,
      tasks,
      clientsAttended,
      visaApplications,
      flightBookings,
      hotelReservations,
      admissionApplications,
      customerCalls,
      newLeads,
      paymentsReceived,
      dailyTarget,
      actualAchievement,
      clientFeedback1,
      clientFeedback2,
      clientFeedback3,
      clientRating,
      challenges,
      supportNeeded,
      supportPriority,
      nextDayPlans,
      selfRating,
      teamLeadReview,
      status, // "DRAFT" | "SUBMITTED"
    } = body;

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const data = {
      staffName: user.name,
      department: department || null,
      position: position || null,
      reportingTime: reportingTime || null,
      closingTime: closingTime || null,
      tasks: tasks ?? [],
      clientsAttended: clientsAttended || null,
      visaApplications: visaApplications || null,
      flightBookings: flightBookings || null,
      hotelReservations: hotelReservations || null,
      admissionApplications: admissionApplications || null,
      customerCalls: customerCalls || null,
      newLeads: newLeads || null,
      paymentsReceived: paymentsReceived || null,
      dailyTarget: dailyTarget || null,
      actualAchievement: actualAchievement || null,
      clientFeedback1: clientFeedback1 || null,
      clientFeedback2: clientFeedback2 || null,
      clientFeedback3: clientFeedback3 || null,
      clientRating: clientRating ? Number(clientRating) : null,
      challenges: challenges || null,
      supportNeeded: supportNeeded || null,
      supportPriority: supportPriority || null,
      nextDayPlans: nextDayPlans || null,
      selfRating: selfRating ?? {},
      teamLeadReview: teamLeadReview || null,
      status: status || "DRAFT",
      submittedAt: status === "SUBMITTED" ? new Date() : undefined,
    };

    const report = await prisma.dailyReport.upsert({
      where: { staffId_date: { staffId: user.id, date } },
      update: data,
      create: { staffId: user.id, date, ...data },
      include: {
        staff: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("POST /api/daily-reports error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
