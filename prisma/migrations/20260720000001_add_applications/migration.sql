-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "travelPurpose" TEXT NOT NULL,
    "expectedTravelDate" TIMESTAMP(3),
    "currentStage" TEXT NOT NULL DEFAULT 'CLIENT_INQUIRY',
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "decisionStatus" TEXT,
    "assignedStaffId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
