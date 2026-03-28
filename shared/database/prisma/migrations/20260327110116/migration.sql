-- CreateTable
CREATE TABLE "Instance" (
    "status" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("pathName")
);

-- CreateTable
CREATE TABLE "Path" (
    "name" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "RecordSourceMetadata" (
    "recordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uploader" TEXT NOT NULL,
    "dateUploaded" TIMESTAMP(3) NOT NULL,
    "webpageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RecordSourceMetadata_pkey" PRIMARY KEY ("recordId")
);

-- CreateTable
CREATE TABLE "RecordProps" (
    "id" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,
    "sourceMetadataId" TEXT,
    "manifestPath" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordProps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_pathName_fkey" FOREIGN KEY ("pathName") REFERENCES "Path"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProps" ADD CONSTRAINT "RecordProps_pathName_fkey" FOREIGN KEY ("pathName") REFERENCES "Path"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordProps" ADD CONSTRAINT "RecordProps_sourceMetadataId_fkey" FOREIGN KEY ("sourceMetadataId") REFERENCES "RecordSourceMetadata"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;
