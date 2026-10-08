import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/daily-reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD&staffId=123
// Returns all reports for the given date range (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.role.toUpperCase() === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const staffId = searchParams.get("staffId");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: "DRAFT" },
        ...(staffId ? { staffId: parseInt(staffId, 10) } : {}),
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ staffId: "asc" }, { date: "asc" }],
    });

    // Aggregate totals per staff member for the range
    type StaffSummary = {
      staffId: number;
      staffName: string;
      department: string;
      position: string;
      totalClients: number;
      totalVisas: number;
      totalFlights: number;
      totalHotels: number;
      totalAdmissions: number;
      totalCalls: number;
      totalLeads: number;
      totalRevenue: number;
      daysReported: number;
      reviewedDays: number;
    };

    const summaryMap = new Map<number, StaffSummary>();

    for (const r of reports) {
      if (!summaryMap.has(r.staffId)) {
        summaryMap.set(r.staffId, {
          staffId: r.staffId,
          staffName: r.staffName || "",
          department: r.department || "",
          position: r.position || "",
          totalClients: 0,
          totalVisas: 0,
          totalFlights: 0,
          totalHotels: 0,
          totalAdmissions: 0,
          totalCalls: 0,
          totalLeads: 0,
          totalRevenue: 0,
          daysReported: 0,
          reviewedDays: 0,
        });
      }
      const s = summaryMap.get(r.staffId)!;
      s.totalClients += parseInt(r.clientsAttended || "0", 10) || 0;
      s.totalVisas += parseInt(r.visaApplications || "0", 10) || 0;
      s.totalFlights += parseInt(r.flightBookings || "0", 10) || 0;
      s.totalHotels += parseInt(r.hotelReservations || "0", 10) || 0;
      s.totalAdmissions += parseInt(r.admissionApplications || "0", 10) || 0;
      s.totalCalls += parseInt(r.customerCalls || "0", 10) || 0;
      s.totalLeads += parseInt(r.newLeads || "0", 10) || 0;
      const rev = parseFloat((r.paymentsReceived || "0").replace(/[^0-9.]/g, ""));
      s.totalRevenue += isNaN(rev) ? 0 : rev;
      s.daysReported += 1;
      if (r.status === "REVIEWED") s.reviewedDays += 1;
    }

    return NextResponse.json({
      reports,
      summaries: Array.from(summaryMap.values()),
    });
  } catch (err) {
    console.error("GET /api/daily-reports/range error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
