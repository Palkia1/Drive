-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "driving_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driving_schools_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drivingSchoolId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "licenses_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "friendCode" TEXT NOT NULL,
    "drivingSchoolId" TEXT,
    "licenseCategory" TEXT NOT NULL DEFAULT 'B',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "showOnLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "shareXpWithFriends" BOOLEAN NOT NULL DEFAULT true,
    "shareStreakWithFriends" BOOLEAN NOT NULL DEFAULT true,
    "shareBadgesWithFriends" BOOLEAN NOT NULL DEFAULT true,
    "shareMasteryWithFriends" BOOLEAN NOT NULL DEFAULT true,
    "activeTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_profiles_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "topicId" TEXT,
    "label" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "challenges_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "challenges_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startXp" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "challenge_participants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'road-sign',
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "topics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtopics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "subtopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "subtopicId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "scene" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "subtopics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "theory_lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    CONSTRAINT "theory_lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "topicIds" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "practice_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answer" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "practice_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "masteries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "recentOutcomes" TEXT NOT NULL DEFAULT '',
    "confidence" REAL NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "masteries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "masteries_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "question_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_marks_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "xp_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common'
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    CONSTRAINT "daily_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scorePct" REAL NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "breakdown" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exam_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exam_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "practice_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "driving_schools_code_key" ON "driving_schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "driving_schools_ownerId_key" ON "driving_schools"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_drivingSchoolId_key" ON "licenses"("drivingSchoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_username_key" ON "student_profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_friendCode_key" ON "student_profiles"("friendCode");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_challengeId_studentId_key" ON "challenge_participants"("challengeId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subtopics_slug_key" ON "subtopics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "theory_lessons_slug_key" ON "theory_lessons"("slug");

-- CreateIndex
CREATE INDEX "attempts_studentId_questionId_idx" ON "attempts"("studentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "masteries_studentId_topicId_key" ON "masteries"("studentId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "question_marks_studentId_questionId_reason_key" ON "question_marks"("studentId", "questionId", "reason");

-- CreateIndex
CREATE INDEX "xp_events_studentId_createdAt_idx" ON "xp_events"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_studentId_badgeId_key" ON "user_badges"("studentId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_goals_studentId_date_key" ON "daily_goals"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_sessionId_key" ON "exam_results"("sessionId");
