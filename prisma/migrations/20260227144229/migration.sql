/*
  Warnings:

  - The primary key for the `ActiveStreams` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `creatorId` on the `ActiveStreams` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `ActiveStreams` table. All the data in the column will be lost.
  - The primary key for the `Creator` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Creator` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `VodProps` table. All the data in the column will be lost.
  - Added the required column `creatorName` to the `ActiveStreams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorName` to the `VodProps` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActiveStreams" (
    "status" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL PRIMARY KEY,
    CONSTRAINT "ActiveStreams_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActiveStreams" ("status") SELECT "status" FROM "ActiveStreams";
DROP TABLE "ActiveStreams";
ALTER TABLE "new_ActiveStreams" RENAME TO "ActiveStreams";
CREATE TABLE "new_Creator" (
    "name" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_Creator" ("name") SELECT "name" FROM "Creator";
DROP TABLE "Creator";
ALTER TABLE "new_Creator" RENAME TO "Creator";
CREATE TABLE "new_VodProps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorName" TEXT NOT NULL,
    "manifestPath" TEXT NOT NULL,
    "datePublished" DATETIME NOT NULL,
    CONSTRAINT "VodProps_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VodProps" ("datePublished", "id", "manifestPath") SELECT "datePublished", "id", "manifestPath" FROM "VodProps";
DROP TABLE "VodProps";
ALTER TABLE "new_VodProps" RENAME TO "VodProps";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
