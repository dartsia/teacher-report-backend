-- CreateEnum
CREATE TYPE "StudyForm" AS ENUM ('FULL_TIME', 'PART_TIME');

-- AlterTable
ALTER TABLE "Discipline" ADD COLUMN     "studyForm" "StudyForm" NOT NULL DEFAULT 'FULL_TIME';
