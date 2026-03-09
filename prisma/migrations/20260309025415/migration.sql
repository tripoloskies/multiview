-- CreateTable
CREATE TABLE "ActiveStreams" (
    "status" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL PRIMARY KEY,
    CONSTRAINT "ActiveStreams_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Creator" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "VodMetadata" (
    "streamId" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "uploader" TEXT NOT NULL,
    "dateUploaded" DATETIME NOT NULL,
    "webpageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VodProps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorName" TEXT NOT NULL,
    "metadataId" TEXT,
    "manifestPath" TEXT NOT NULL,
    "datePublished" DATETIME NOT NULL,
    CONSTRAINT "VodProps_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator" ("name") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VodProps_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VodMetadata" ("streamId") ON DELETE SET NULL ON UPDATE CASCADE
);
