-- Migration to remove volunteer application functionality
-- Drop the volunteer_applications table first (because of foreign key constraints)
DROP TABLE IF EXISTS "volunteer_applications";

-- Remove the accepting_volunteers column from organizations table
ALTER TABLE "organizations" DROP COLUMN IF EXISTS "accepting_volunteers";
