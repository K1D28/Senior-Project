-- Add metadata fields for admin-entered paper/offline farmer submissions
ALTER TABLE "Sample"
ADD COLUMN "offlineFarmerName" TEXT,
ADD COLUMN "offlineFarmerTag" TEXT,
ADD COLUMN "offlineSubmissionRef" TEXT;
