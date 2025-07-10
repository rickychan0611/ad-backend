-- CreateTable
CREATE TABLE "Ad" (
    "id" SERIAL NOT NULL,
    "groupLink" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "keywords" TEXT NOT NULL,
    "recommendedText" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "targetGender" TEXT NOT NULL,
    "targetAgeRange" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "lastJoinTime" TIMESTAMP(3),
    "countries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
