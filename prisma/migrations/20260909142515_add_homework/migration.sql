-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT,
    "targetCount" INTEGER NOT NULL,
    "note" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_studentId_createdAt_idx" ON "homework"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

