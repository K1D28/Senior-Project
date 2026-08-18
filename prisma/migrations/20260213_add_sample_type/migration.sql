-- Add sampleType column to Sample table
ALTER TABLE "Sample" ADD COLUMN "sampleType" TEXT NOT NULL DEFAULT 'FARMER_REGISTERED';
