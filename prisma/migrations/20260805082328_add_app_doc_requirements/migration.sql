-- CreateTable
CREATE TABLE IF NOT EXISTS "application_document_requirements" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "application_document_requirements_appId_tplId_key" ON "application_document_requirements"("applicationId", "documentTemplateId");

-- AddForeignKey
ALTER TABLE "application_document_requirements" ADD CONSTRAINT "application_document_requirements_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_document_requirements" ADD CONSTRAINT "application_document_requirements_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "document_templates"("id") ON UPDATE CASCADE;
