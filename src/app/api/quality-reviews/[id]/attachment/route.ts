import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/quality-reviews/[id]/attachment — Stream the review attachment
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
    const review = await prisma.qualityReview.findUnique({
      where: { id: Number(id) },
      select: { id: true, attachmentFileName: true, attachmentUrl: true },
    });

    if (!review || !review.attachmentUrl) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    let mimeType = "application/octet-stream";
    let base64Data = review.attachmentUrl;

    if (review.attachmentUrl.startsWith("data:")) {
      const commaIdx = review.attachmentUrl.indexOf(",");
      if (commaIdx !== -1) {
        const header = review.attachmentUrl.substring(5, commaIdx);
        const mimeMatch = header.match(/^([^;]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = review.attachmentUrl.substring(commaIdx + 1);
      }
    } else {
      return NextResponse.redirect(review.attachmentUrl);
    }

    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${review.attachmentFileName || "attachment"}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Download review attachment error:", error);
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 500 });
  }
}
