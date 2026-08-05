import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/documents/[id]/download — Stream the document file for viewing/download
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
    const doc = await prisma.document.findUnique({
      where: { id: Number(id) },
      select: { id: true, fileName: true, fileUrl: true, documentType: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.fileUrl) {
      return NextResponse.json({ error: "No file data stored for this document" }, { status: 404 });
    }

    // The file is stored as a base64 data URL: "data:mime/type;base64,..."
    let mimeType = "application/octet-stream";
    let base64Data = doc.fileUrl;

    if (doc.fileUrl.startsWith("data:")) {
      const commaIdx = doc.fileUrl.indexOf(",");
      if (commaIdx !== -1) {
        const header = doc.fileUrl.substring(5, commaIdx);
        const mimeMatch = header.match(/^([^;]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = doc.fileUrl.substring(commaIdx + 1);
      }
    } else {
      // Not a data URL — redirect
      return NextResponse.redirect(doc.fileUrl);
    }

    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${doc.fileName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Download document error:", error);
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
