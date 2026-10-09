-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "actorKind" TEXT NOT NULL DEFAULT 'customer',
    "actorId" TEXT NOT NULL,
    "createRequestId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerPhone" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceIdr" INTEGER NOT NULL,
    "totalPriceIdr" INTEGER NOT NULL,
    "originalDeadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_payment',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassSession" (
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
    "capacityRevision" INTEGER NOT NULL DEFAULT 1,
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
INSERT INTO "new_ClassSession" ("classId", "createRequestId", "createdAt", "createdById", "durationMinutes", "id", "isSample", "levelId", "maxParticipants", "minParticipants", "priceIdr", "startsAt", "status", "updatedAt", "updatedById", "venueId", "version") SELECT "classId", "createRequestId", "createdAt", "createdById", "durationMinutes", "id", "isSample", "levelId", "maxParticipants", "minParticipants", "priceIdr", "startsAt", "status", "updatedAt", "updatedById", "venueId", "version" FROM "ClassSession";
DROP TABLE "ClassSession";
ALTER TABLE "new_ClassSession" RENAME TO "ClassSession";
CREATE UNIQUE INDEX "ClassSession_createRequestId_key" ON "ClassSession"("createRequestId");
CREATE INDEX "ClassSession_startsAt_idx" ON "ClassSession"("startsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Booking_sessionId_status_originalDeadline_idx" ON "Booking"("sessionId", "status", "originalDeadline");

-- CreateIndex
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_actorKind_actorId_createRequestId_key" ON "Booking"("actorKind", "actorId", "createRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingParticipant_bookingId_position_key" ON "BookingParticipant"("bookingId", "position");
