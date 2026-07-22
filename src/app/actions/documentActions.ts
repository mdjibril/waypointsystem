"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDocumentsAction() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { documents };
  } catch (err: any) {
    console.error("Failed to fetch documents:", err);
    return { error: err.message || "Failed to fetch documents." };
  }
}

export async function createDocumentAction(data: {
  clientId?: number;
  applicationId?: number;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  uploadedById: number;
}) {
  try {
    const document = await prisma.document.create({
      data: {
        clientId: data.clientId || null,
        applicationId: data.applicationId || null,
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl: data.fileUrl || null,
        uploadedById: data.uploadedById,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { document };
  } catch (err: any) {
    console.error("Failed to create document:", err);
    return { error: err.message || "Failed to create document." };
  }
}

export async function updateDocumentAction(
  id: number,
  data: {
    status?: string;
    verificationNotes?: string;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.verificationNotes !== undefined) {
      updateData.verificationNotes = data.verificationNotes || null;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { document };
  } catch (err: any) {
    console.error("Failed to update document:", err);
    return { error: err.message || "Failed to update document." };
  }
}

export async function getDocumentTemplatesAction() {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { templates };
  } catch (err: any) {
    console.error("Failed to fetch templates:", err);
    return { error: err.message || "Failed to fetch templates." };
  }
}
