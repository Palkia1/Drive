-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "seedKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "questions_seedKey_key" ON "questions"("seedKey");
