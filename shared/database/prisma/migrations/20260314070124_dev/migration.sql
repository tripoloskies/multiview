-- CreateTable
CREATE TABLE "ActiveStreams" (
    "status" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,

    CONSTRAINT "ActiveStreams_pkey" PRIMARY KEY ("creatorName")
);

-- CreateTable
CREATE TABLE "Creator" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "VodMetadata" (
    "streamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uploader" TEXT NOT NULL,
    "dateUploaded" TIMESTAMP(3) NOT NULL,
    "webpageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "VodMetadata_pkey" PRIMARY KEY ("streamId")
);

-- CreateTable
CREATE TABLE "VodProps" (
    "id" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "metadataId" TEXT,
    "manifestPath" TEXT NOT NULL,
    "datePublished" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VodProps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActiveStreams" ADD CONSTRAINT "ActiveStreams_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VodProps" ADD CONSTRAINT "VodProps_creatorName_fkey" FOREIGN KEY ("creatorName") REFERENCES "Creator"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VodProps" ADD CONSTRAINT "VodProps_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "VodMetadata"("streamId") ON DELETE SET NULL ON UPDATE CASCADE;
