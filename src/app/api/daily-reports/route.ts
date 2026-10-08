import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/daily-reports?date=YYYY-MM-DD (v2)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month"); // e.g. "2026-10"
    const allParam = searchParams.get("all") === "true" || dateParam === "all";
    const isAdmin = user.role.toUpperCase() === "ADMIN";

    let dateWhere: any = undefined;
    if (allParam) {
      dateWhere = undefined;
    } else if (monthParam) {
      dateWhere = { startsWith: monthParam };
    } else if (dateParam) {
      dateWhere = dateParam;
    } else {
      dateWhere = new Date().toISOString().slice(0, 10);
    }

    const reports = await prisma.dailyReport.findMany({
      where: {
        ...(dateWhere ? { date: dateWhere } : {}),
        ...(isAdmin ? { status: { not: "DRAFT" } } : { staffId: user.id }),
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    let latestDepartment: string | undefined = undefined;
    if (!isAdmin) {
      const latest = await prisma.dailyReport.findFirst({
        where: { staffId: user.id, department: { not: "" } },
        orderBy: { createdAt: "desc" },
        select: { department: true },
      });
      if (latest?.department) {
        latestDepartment = latest.department;
      }
    }

    return NextResponse.json({ reports, latestDepartment });
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
      tasksOverdue,
      reasonForOverdue,
      clientFollowUps,
      complaintsEscalations,
      nextDayPlans,
      selfRating,
      teamLeadReview,
      status, // "DRAFT" | "SUBMITTED"
    } = body;

    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const baseData = {
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

    const newFields = {
      tasksOverdue: tasksOverdue || null,
      reasonForOverdue: reasonForOverdue || null,
      clientFollowUps: clientFollowUps || null,
      complaintsEscalations: complaintsEscalations || null,
    };

    let report;
    try {
      report = await prisma.dailyReport.upsert({
        where: { staffId_date: { staffId: user.id, date } },
        update: { ...baseData, ...newFields },
        create: { staffId: user.id, date, ...baseData, ...newFields },
        include: {
          staff: { select: { id: true, name: true, role: true } },
        },
      });
    } catch (upsertErr: any) {
      if (
        upsertErr?.name === "PrismaClientValidationError" ||
        upsertErr?.message?.includes("tasksOverdue")
      ) {
        console.warn("Retrying upsert with base fields (dev server reload pending):", upsertErr.message);
        report = await prisma.dailyReport.upsert({
          where: { staffId_date: { staffId: user.id, date } },
          update: baseData,
          create: { staffId: user.id, date, ...baseData },
          include: {
            staff: { select: { id: true, name: true, role: true } },
          },
        });
      } else {
        throw upsertErr;
      }
    }

    return NextResponse.json({ report });
  } catch (err: any) {
    console.error("POST /api/daily-reports error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
