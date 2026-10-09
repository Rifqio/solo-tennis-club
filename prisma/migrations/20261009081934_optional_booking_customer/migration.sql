-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT,
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
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("actorId", "actorKind", "bookerName", "bookerPhone", "createRequestId", "createdAt", "customerId", "fingerprint", "id", "originalDeadline", "quantity", "sessionId", "status", "totalPriceIdr", "unitPriceIdr", "version") SELECT "actorId", "actorKind", "bookerName", "bookerPhone", "createRequestId", "createdAt", "customerId", "fingerprint", "id", "originalDeadline", "quantity", "sessionId", "status", "totalPriceIdr", "unitPriceIdr", "version" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_sessionId_status_originalDeadline_idx" ON "Booking"("sessionId", "status", "originalDeadline");
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");
CREATE UNIQUE INDEX "Booking_actorKind_actorId_createRequestId_key" ON "Booking"("actorKind", "actorId", "createRequestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
