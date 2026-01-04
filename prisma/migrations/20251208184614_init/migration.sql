-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PARSED', 'VALIDATED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "rawData" JSONB,
    "parsedData" JSONB,
    "originalFileName" TEXT,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "lectures" INTEGER NOT NULL DEFAULT 0,
    "practicals" INTEGER NOT NULL DEFAULT 0,
    "labs" INTEGER NOT NULL DEFAULT 0,
    "consultations" INTEGER NOT NULL DEFAULT 0,
    "exams" INTEGER NOT NULL DEFAULT 0,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "controlWorks" INTEGER NOT NULL DEFAULT 0,
    "courseWorks" INTEGER NOT NULL DEFAULT 0,
    "thesisWorks" INTEGER NOT NULL DEFAULT 0,
    "totalHours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
