/*
  Warnings:

  - You are about to drop the column `consultations` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `exams` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `labs` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `lectures` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `practicals` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `studentsCount` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `studyForm` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Discipline` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discipline" DROP COLUMN "consultations",
DROP COLUMN "credits",
DROP COLUMN "exams",
DROP COLUMN "labs",
DROP COLUMN "lectures",
DROP COLUMN "practicals",
DROP COLUMN "studentsCount",
DROP COLUMN "studyForm",
DROP COLUMN "updatedAt",
ADD COLUMN     "consultationsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consultationsPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditsPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "examsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "examsPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "labsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "labsPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lecturesFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lecturesPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practicalsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practicalsPartTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "studentsFullTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "studentsPartTime" INTEGER NOT NULL DEFAULT 0;
