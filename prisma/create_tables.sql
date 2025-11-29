-- Create WorkExperience table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."WorkExperience" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "experienceTitle" TEXT,
    "company" TEXT,
    "position" TEXT,
    "from" TIMESTAMP(3),
    "till" TIMESTAMP(3),
    "stillWorking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

-- Create Education table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."Education" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "educationTitle" TEXT,
    "institution" TEXT,
    "degree" TEXT,
    "from" TIMESTAMP(3),
    "till" TIMESTAMP(3),
    "stillStudying" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- Create HousingDetails table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."HousingDetails" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousingDetails_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "HousingDetails_userId_key" ON "public"."HousingDetails"("userId");

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'WorkExperience_userId_fkey'
    ) THEN
        ALTER TABLE "public"."WorkExperience" 
        ADD CONSTRAINT "WorkExperience_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Education_userId_fkey'
    ) THEN
        ALTER TABLE "public"."Education" 
        ADD CONSTRAINT "Education_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'HousingDetails_userId_fkey'
    ) THEN
        ALTER TABLE "public"."HousingDetails" 
        ADD CONSTRAINT "HousingDetails_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

