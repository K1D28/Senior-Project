-- Add farmer profile fields
ALTER TABLE "Farmer" ADD COLUMN "farmName" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "variety" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "region" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "processingMethod" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "altitude" REAL;
ALTER TABLE "Farmer" ADD COLUMN "moisture" REAL;
