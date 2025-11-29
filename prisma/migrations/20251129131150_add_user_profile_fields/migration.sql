/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add nullable columns first
ALTER TABLE "public"."User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "diet" TEXT,
ADD COLUMN     "drinking" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isWhatsappNumber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "sleepSchedule" TEXT,
ADD COLUMN     "smoking" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Update existing rows with current timestamp for updatedAt
UPDATE "public"."User" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- Now make updatedAt NOT NULL
ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."WorkExperience" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "experienceTitle" TEXT,
    "company" TEXT,
    "position" TEXT,
    "from" TIMESTAMP(3),
    "till" TIMESTAMP(3),
    "stillWorking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Education" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "educationTitle" TEXT,
    "institution" TEXT,
    "degree" TEXT,
    "from" TIMESTAMP(3),
    "till" TIMESTAMP(3),
    "stillStudying" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousingDetails" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lookingFor" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "movingDate" TIMESTAMP(3),
    "preferenceLocation" TEXT,
    "searchRadius" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "roomType" TEXT,
    "preferredAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "roomsAvailable" INTEGER,
    "totalRooms" INTEGER,
    "rentPerRoom" INTEGER,
    "availableFrom" TIMESTAMP(3),
    "deposit" DOUBLE PRECISION,
    "availableAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "photosVideos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HousingDetails_userId_key" ON "public"."HousingDetails"("userId");

-- AddForeignKey
ALTER TABLE "public"."WorkExperience" ADD CONSTRAINT "WorkExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousingDetails" ADD CONSTRAINT "HousingDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
