-- AlterTable
ALTER TABLE "Discipline" ADD COLUMN     "educationalPractice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "other" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pedPractice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postgraduateStudies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productionPractice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stateExams" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "StudyForm";
