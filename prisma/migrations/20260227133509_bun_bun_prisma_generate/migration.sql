-- CreateTable
CREATE TABLE "ActiveStreams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,
    CONSTRAINT "ActiveStreams_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VodProps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" INTEGER NOT NULL,
    "manifestPath" TEXT NOT NULL,
    "datePublished" DATETIME NOT NULL,
    CONSTRAINT "VodProps_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveStreams_creatorId_key" ON "ActiveStreams"("creatorId");
