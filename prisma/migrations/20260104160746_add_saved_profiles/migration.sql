-- CreateTable
CREATE TABLE "public"."SavedProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "savedUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedProfile_userId_savedUserId_key" ON "public"."SavedProfile"("userId", "savedUserId");

-- CreateIndex
CREATE INDEX "SavedProfile_userId_idx" ON "public"."SavedProfile"("userId");

-- CreateIndex
CREATE INDEX "SavedProfile_savedUserId_idx" ON "public"."SavedProfile"("savedUserId");

-- CreateIndex
CREATE INDEX "SavedProfile_createdAt_idx" ON "public"."SavedProfile"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."SavedProfile" ADD CONSTRAINT "SavedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProfile" ADD CONSTRAINT "SavedProfile_savedUserId_fkey" FOREIGN KEY ("savedUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

