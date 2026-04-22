-- CreateTable
CREATE TABLE "Instance" (
    "status" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("pathName")
);

-- CreateTable
CREATE TABLE "Path" (
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "RecordSourceMetadata" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uploader" TEXT NOT NULL,
    "dateUploaded" TIMESTAMP(3) NOT NULL,
    "webpageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RecordSourceMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,
    "sourceMetadataId" TEXT,
    "manifestPath" TEXT NOT NULL,
    "datePublished" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_pathName_fkey" FOREIGN KEY ("pathName") REFERENCES "Path"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_pathName_fkey" FOREIGN KEY ("pathName") REFERENCES "Path"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_sourceMetadataId_fkey" FOREIGN KEY ("sourceMetadataId") REFERENCES "RecordSourceMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;
