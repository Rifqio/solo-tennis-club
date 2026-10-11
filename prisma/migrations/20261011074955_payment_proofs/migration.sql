-- CreateTable
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT,
    "submissionId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "rejectionNote" TEXT,
    CONSTRAINT "PaymentProof_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentProof_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentProof_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentProofFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proofId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    CONSTRAINT "PaymentProofFile_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "PaymentProof" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amountIdr" INTEGER NOT NULL,
    "paidOn" TEXT NOT NULL,
    "note" TEXT,
    "requestId" TEXT NOT NULL,
    "recordedById" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "confirmedAt" DATETIME,
    "confirmedById" TEXT,
    "paymentNote" TEXT,
    CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("actorId", "actorKind", "bookerName", "bookerPhone", "createRequestId", "createdAt", "customerId", "fingerprint", "id", "originalDeadline", "quantity", "sessionId", "status", "totalPriceIdr", "unitPriceIdr", "version") SELECT "actorId", "actorKind", "bookerName", "bookerPhone", "createRequestId", "createdAt", "customerId", "fingerprint", "id", "originalDeadline", "quantity", "sessionId", "status", "totalPriceIdr", "unitPriceIdr", "version" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_sessionId_status_originalDeadline_idx" ON "Booking"("sessionId", "status", "originalDeadline");
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");
CREATE UNIQUE INDEX "Booking_actorKind_actorId_createRequestId_key" ON "Booking"("actorKind", "actorId", "createRequestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PaymentProof_status_submittedAt_idx" ON "PaymentProof"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "PaymentProof_bookingId_submittedAt_idx" ON "PaymentProof"("bookingId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_bookingId_submissionId_key" ON "PaymentProof"("bookingId", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProofFile_proofId_position_key" ON "PaymentProofFile"("proofId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_requestId_key" ON "PaymentRecord"("requestId");

-- CreateIndex
CREATE INDEX "PaymentRecord_bookingId_recordedAt_idx" ON "PaymentRecord"("bookingId", "recordedAt");
