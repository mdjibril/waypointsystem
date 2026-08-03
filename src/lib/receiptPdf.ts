import jsPDF, { GState } from "jspdf";
import { formatAmount } from "@/lib/currency";

export interface ReceiptPdfData {
  receiptNumber: string;
  date: string;
  name: string;
  services: string[];
  amount: number;
  currency: string;
  amountWords: string;
  method: string;
  description?: string;
  email?: string;
}

const NAVY: [number, number, number] = [17, 34, 64];
const BRAND_BLUE: [number, number, number] = [13, 71, 161];
const GRAY: [number, number, number] = [107, 114, 128];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function downloadReceiptPdf(data: ReceiptPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  const rightX = pageWidth - marginX;
  const contentWidth = rightX - marginX;
  const labelX = marginX;
  const valueX = marginX + 130;

  const pageHeight = doc.internal.pageSize.getHeight();
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage("/company-noBG.png");
  } catch {
    logo = null;
  }

  // Full-page faded watermark, centered behind all content
  if (logo) {
    const wmSize = 380;
    const wmH = (logo.naturalHeight / logo.naturalWidth) * wmSize;
    const wmX = (pageWidth - wmSize) / 2;
    const wmY = (pageHeight - wmH) / 2;
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.07 }));
    doc.addImage(logo, "PNG", wmX, wmY, wmSize, wmH);
    doc.restoreGraphicsState();
  }

  // Header: logo (left) + document title / receipt meta (right)
  let logoBottom = 110;
  if (logo) {
    const maxW = 170;
    const maxH = 140;
    let w = maxW;
    let h = (logo.naturalHeight / logo.naturalWidth) * w;
    if (h > maxH) {
      h = maxH;
      w = (logo.naturalWidth / logo.naturalHeight) * h;
    }
    doc.addImage(logo, "PNG", marginX, 32, w, h);
    logoBottom = 32 + h;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...NAVY);
    doc.text("WAY POINT TRAVEL LIMITED", marginX, 70);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text("OFFICIAL RECEIPT", rightX, 58, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  doc.text(`Receipt No: ${data.receiptNumber}`, rightX, 78, { align: "right" });
  doc.text(`Date: ${data.date}`, rightX, 94, { align: "right" });

  let y = Math.max(logoBottom, 110) + 22;

  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(2);
  doc.line(marginX, y, rightX, y);

  // Body rows
  y += 36;
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(value, contentWidth - 130);
    doc.text(lines, valueX, y);
    return lines.length;
  };

  y += row("Received From", data.name || "-") * 16;

  y += 24;
  y += row("Services", data.services.length > 0 ? data.services.join(", ") : "-") * 16;

  y += 24;
  y += row("Payment Method", data.method || "-") * 16;

  if (data.description) {
    y += 24;
    y += row("Description", data.description) * 16;
  }

  if (data.email) {
    y += 24;
    y += row("Client Email", data.email) * 16;
  }

  // Amount highlight box
  y += 30;
  const boxH = 66;
  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(marginX, y, contentWidth, boxH, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("AMOUNT PAID", marginX + 20, y + 25);
  doc.setFontSize(24);
  doc.text(formatAmount(data.amount, data.currency), marginX + 20, y + 51);

  y += boxH + 28;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  const wordsLines = doc.splitTextToSize(`Amount in Words: ${data.amountWords}`, contentWidth);
  doc.text(wordsLines, marginX, y);
  y += wordsLines.length * 15;

  // Footer
  y += 48;
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(1);
  doc.line(marginX, y, rightX, y);
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("Thank you for choosing Way Point Travel Limited — We bridge the gap.", pageWidth / 2, y, {
    align: "center",
  });

  doc.save(`Receipt-${data.receiptNumber}.pdf`);
}
