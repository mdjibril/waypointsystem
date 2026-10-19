-- AlterTable
ALTER TABLE "service_types" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'VISA',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "serviceTypeId" INTEGER,
ADD COLUMN "workflowRoute" JSONB;

-- CreateTable
CREATE TABLE "service_workflow_steps" (
    "id" SERIAL NOT NULL,
    "serviceTypeId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'MAIN',
    "label" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_workflow_steps_serviceTypeId_stage_key" ON "service_workflow_steps"("serviceTypeId", "stage");

-- CreateIndex
CREATE INDEX "service_workflow_steps_serviceTypeId_order_idx" ON "service_workflow_steps"("serviceTypeId", "order");

-- AddForeignKey
ALTER TABLE "service_workflow_steps" ADD CONSTRAINT "service_workflow_steps_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
