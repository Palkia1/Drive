-- CreateIndex
CREATE INDEX "attempts_sessionId_questionId_idx" ON "attempts"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "friendships_addresseeId_idx" ON "friendships"("addresseeId");

-- CreateIndex
CREATE INDEX "practice_sessions_studentId_completedAt_idx" ON "practice_sessions"("studentId", "completedAt");

-- CreateIndex
CREATE INDEX "questions_topicId_status_idx" ON "questions"("topicId", "status");

-- CreateIndex
CREATE INDEX "student_profiles_drivingSchoolId_lastActivityAt_idx" ON "student_profiles"("drivingSchoolId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "xp_events_createdAt_idx" ON "xp_events"("createdAt");

