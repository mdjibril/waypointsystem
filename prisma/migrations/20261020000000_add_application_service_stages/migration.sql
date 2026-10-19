-- AlterTable
ALTER TABLE "applications" ADD COLUMN "phase" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "application_stage_history" ADD COLUMN "phase" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "application_phases" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "phase" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceTypeId" INTEGER,
    "workflowRoute" JSONB,
    "finalStage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decisionStatus" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_phases_applicationId_phase_key" ON "application_phases"("applicationId", "phase");

-- AddForeignKey
ALTER TABLE "application_phases" ADD CONSTRAINT "application_phases_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_phases" ADD CONSTRAINT "application_phases_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

