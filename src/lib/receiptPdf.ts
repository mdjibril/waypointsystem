import jsPDF from "jspdf";
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

export function downloadReceiptPdf(data: ReceiptPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("WAY POINT TRAVEL LTD", marginX, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  y += 18;
  doc.text("Official Payment Receipt", marginX, y);

  y += 28;
  doc.setDrawColor(200);
  doc.line(marginX, y, 547, y);

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.text("Receipt No:", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.receiptNumber, marginX + 90, y);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", 340, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, 340 + 45, y);

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.text("Received From:", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.name || "-", marginX + 100, y);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.text("Services:", marginX, y);
  doc.setFont("helvetica", "normal");
  const servicesText = data.services.length > 0 ? data.services.join(", ") : "-";
  const servicesLines = doc.splitTextToSize(servicesText, 400);
  doc.text(servicesLines, marginX + 100, y);
  y += servicesLines.length * 14;

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Amount:", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatAmount(data.amount, data.currency), marginX + 100, y);

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.text("Amount in Words:", marginX, y);
  doc.setFont("helvetica", "normal");
  const wordsLines = doc.splitTextToSize(data.amountWords, 400);
  doc.text(wordsLines, marginX + 100, y);
  y += wordsLines.length * 14;

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.method || "-", marginX + 100, y);

  if (data.description) {
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", marginX, y);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(data.description, 400);
    doc.text(descLines, marginX + 100, y);
    y += descLines.length * 14;
  }

  if (data.email) {
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.text("Client Email:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.email, marginX + 100, y);
  }

  y += 60;
  doc.line(marginX, y, marginX + 180, y);
  y += 14;
  doc.setFontSize(9);
  doc.text("Authorized Signature", marginX, y);

  doc.save(`Receipt-${data.receiptNumber}.pdf`);
}
