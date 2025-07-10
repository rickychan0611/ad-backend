/*
  Warnings:

  - You are about to drop the column `claimedUser` on the `ads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ads" DROP COLUMN "claimedUser";

-- CreateTable
CREATE TABLE "claimed_ads" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "mediaUserId" INTEGER NOT NULL,
    "claimedNumber" INTEGER NOT NULL,
    "urls" JSONB,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "claimed_ads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "claimed_ads" ADD CONSTRAINT "claimed_ads_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claimed_ads" ADD CONSTRAINT "claimed_ads_mediaUserId_fkey" FOREIGN KEY ("mediaUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
