/*
  Warnings:

  - You are about to drop the column `studentsFullTime` on the `Discipline` table. All the data in the column will be lost.
  - You are about to drop the column `studentsPartTime` on the `Discipline` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discipline" DROP COLUMN "studentsFullTime",
DROP COLUMN "studentsPartTime",
ADD COLUMN     "students" INTEGER NOT NULL DEFAULT 0;
