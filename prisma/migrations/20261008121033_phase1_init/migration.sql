-- CreateTable
CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordUpdatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "csrfToken" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailKey" TEXT NOT NULL,
    "ipKey" TEXT NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createRequestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "address" TEXT,
    "createRequestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createRequestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TennisClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "defaultLevelId" TEXT NOT NULL,
    "defaultVenueId" TEXT NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "defaultPriceIdr" INTEGER NOT NULL,
    "defaultMinParticipants" INTEGER NOT NULL,
    "defaultMaxParticipants" INTEGER NOT NULL,
    "createRequestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TennisClass_defaultLevelId_fkey" FOREIGN KEY ("defaultLevelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TennisClass_defaultVenueId_fkey" FOREIGN KEY ("defaultVenueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassDefaultCoach" (
    "classId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("classId", "coachId"),
    CONSTRAINT "ClassDefaultCoach_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TennisClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassDefaultCoach_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceIdr" INTEGER NOT NULL,
    "minParticipants" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createRequestId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TennisClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionCoach" (
    "sessionId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("sessionId", "coachId"),
    CONSTRAINT "SessionCoach_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionCoach_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_email_key" ON "AdminAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "LoginAttempt_emailKey_createdAt_idx" ON "LoginAttempt"("emailKey", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipKey_createdAt_idx" ON "LoginAttempt"("ipKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_nameKey_key" ON "Coach"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_createRequestId_key" ON "Coach"("createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_nameKey_key" ON "Venue"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_createRequestId_key" ON "Venue"("createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_nameKey_key" ON "Level"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Level_createRequestId_key" ON "Level"("createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "TennisClass_nameKey_key" ON "TennisClass"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "TennisClass_createRequestId_key" ON "TennisClass"("createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassDefaultCoach_classId_position_key" ON "ClassDefaultCoach"("classId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_createRequestId_key" ON "ClassSession"("createRequestId");

-- CreateIndex
CREATE INDEX "ClassSession_startsAt_idx" ON "ClassSession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCoach_sessionId_position_key" ON "SessionCoach"("sessionId", "position");
