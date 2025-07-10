-- AlterTable
ALTER TABLE "ads" ADD COLUMN     "costPerPost" DOUBLE PRECISION,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "totalPosts" INTEGER;

-- CreateTable
CREATE TABLE "media_assignments" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "mediaUserId" INTEGER NOT NULL,
    "assignedPosts" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "urls" JSONB,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "media_assignments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "media_assignments" ADD CONSTRAINT "media_assignments_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assignments" ADD CONSTRAINT "media_assignments_mediaUserId_fkey" FOREIGN KEY ("mediaUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
