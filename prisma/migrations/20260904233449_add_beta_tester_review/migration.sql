-- CreateEnum
CREATE TYPE "QuestionReviewAction" AS ENUM ('APPROVED', 'EDITED_PROMPT', 'EDITED_ANSWERS', 'DISCARDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isBetaTester" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "question_reviews" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "action" "QuestionReviewAction" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_reviews_questionId_idx" ON "question_reviews"("questionId");

-- AddForeignKey
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reviews" ADD CONSTRAINT "question_reviews_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
