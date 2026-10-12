-- CreateTable
CREATE TABLE "SessionPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "SessionPhoto_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AdminAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SessionPhoto_sessionId_deletedAt_position_idx" ON "SessionPhoto"("sessionId", "deletedAt", "position");

-- CreateIndex
CREATE INDEX "SessionPhoto_createdAt_idx" ON "SessionPhoto"("createdAt");
