-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_shareId_key" ON "public"."User"("shareId");

