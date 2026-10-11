-- CreateTable
CREATE TABLE "BookingOwnershipEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "adminId" TEXT,
    "previousCustomerId" TEXT,
    "customerId" TEXT,
    "bookingVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingOwnershipEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingOwnershipEvent_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingOwnershipEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BookingOwnershipEvent_bookingId_createdAt_idx" ON "BookingOwnershipEvent"("bookingId", "createdAt");

