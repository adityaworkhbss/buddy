-- CreateTable
CREATE TABLE "public"."OtpSession" (
    "sessionId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "timeOfCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE INDEX "OtpSession_phone_idx" ON "public"."OtpSession"("phone");

-- CreateIndex
CREATE INDEX "OtpSession_timeOfCreation_idx" ON "public"."OtpSession"("timeOfCreation");
