import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { DisciplineData, ReportData, generatePdfReport } from '../utils/pdf-generator';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) { }

  async getAllReports(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
        disciplines: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReport(id: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
        disciplines: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Звіт не знайдено');
    }

    if (report.userId !== userId) {
      throw new ForbiddenException('У вас немає доступу до цього звіту');
    }

    return report;
  }

  async getDisciplines(reportId: string, userId: string) {
    await this.getReport(reportId, userId);

    return this.prisma.discipline.findMany({
      where: { reportId },
      orderBy: { name: 'asc' },
    });
  }

  async updateDiscipline(id: string, data: any, userId: string) {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!discipline) throw new NotFoundException('Дисципліну не знайдено');
    if (discipline.report.userId !== userId) throw new ForbiddenException('...');

    const totalHours =
      (data.lecturesFullTime ?? discipline.lecturesFullTime) +
      (data.lecturesPartTime ?? discipline.lecturesPartTime) +
      (data.practicalsFullTime ?? discipline.practicalsFullTime) +
      (data.practicalsPartTime ?? discipline.practicalsPartTime) +
      (data.labsFullTime ?? discipline.labsFullTime) +
      (data.labsPartTime ?? discipline.labsPartTime) +
      (data.consultationsFullTime ?? discipline.consultationsFullTime) +
      (data.consultationsPartTime ?? discipline.consultationsPartTime) +
      (data.examsFullTime ?? discipline.examsFullTime) +
      (data.examsPartTime ?? discipline.examsPartTime) +
      (data.creditsFullTime ?? discipline.creditsFullTime) +
      (data.creditsPartTime ?? discipline.creditsPartTime);

    return this.prisma.discipline.update({
      where: { id },
      data: { ...data, totalHours },
    });
  }

  async deleteDiscipline(id: string, userId: string) {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!discipline) {
      throw new NotFoundException('Дисципліну не знайдено');
    }

    if (discipline.report.userId !== userId) {
      throw new ForbiddenException('У вас немає доступу до цієї дисципліни');
    }

    return this.prisma.discipline.delete({
      where: { id },
    });
  }

  async addDiscipline(reportId: string, data: any, userId: string) {
    await this.getReport(reportId, userId);

    const totalHours =
      (data.lecturesFullTime || 0) + (data.lecturesPartTime || 0) +
      (data.practicalsFullTime || 0) + (data.practicalsPartTime || 0) +
      (data.labsFullTime || 0) + (data.labsPartTime || 0) +
      (data.consultationsFullTime || 0) + (data.consultationsPartTime || 0) +
      (data.examsFullTime || 0) + (data.examsPartTime || 0) +
      (data.creditsFullTime || 0) + (data.creditsPartTime || 0);

    return this.prisma.discipline.create({
      data: {
        reportId,
        name: data.name || '',
        faculty: data.faculty || '',
        specialty: data.specialty || '',
        course: data.course || 1,
        semester: data.semester || 1,
        students: data.students || 0,
        lecturesFullTime: data.lecturesFullTime || 0,
        lecturesPartTime: data.lecturesPartTime || 0,
        practicalsFullTime: data.practicalsFullTime || 0,
        practicalsPartTime: data.practicalsPartTime || 0,
        labsFullTime: data.labsFullTime || 0,
        labsPartTime: data.labsPartTime || 0,
        consultationsFullTime: data.consultationsFullTime || 0,
        consultationsPartTime: data.consultationsPartTime || 0,
        examsFullTime: data.examsFullTime || 0,
        examsPartTime: data.examsPartTime || 0,
        creditsFullTime: data.creditsFullTime || 0,
        creditsPartTime: data.creditsPartTime || 0,
        totalHours,
      },
    });
  }

  async validateReport(id: string, userId: string) {
    const report = await this.getReport(id, userId);
    const disciplines = await this.getDisciplines(id, userId);

    const errors: string[] = [];

    if (disciplines.length === 0) {
      errors.push('Звіт не містить жодної дисципліни');
    }

    for (const disc of disciplines) {
      if (!disc.name) {
        errors.push(`Дисципліна ${disc.id} не має назви`);
      }
      // if (disc.studentsCount <= 0 && ) {
      //   errors.push(`Дисципліна "${disc.name}" має невірну кількість студентів`);
      // }
      // if (disc.totalHours <= 0) {
      //   errors.push(`Дисципліна "${disc.name}" має 0 годин`);
      // }
    }

    const isValid = errors.length === 0;

    if (isValid) {
      await this.prisma.report.update({
        where: { id },
        data: { status: 'VALIDATED' },
      });
    }

    return {
      valid: isValid,
      errors,
    };
  }

  async completeReport(id: string, userId: string) {
    const validation = await this.validateReport(id, userId);

    if (!validation.valid) {
      return {
        success: false,
        message: 'Звіт містить помилки',
        errors: validation.errors,
      };
    }

    await this.prisma.report.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return {
      success: true,
      message: 'Звіт успішно завершено',
    };
  }

  async exportToPdf(id: string, userId: string): Promise<Buffer> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { user: true, disciplines: true },
    });

    if (!report) throw new NotFoundException('Report not found');

    const meta = (report.parsedData as any)?.metadata || {};

    const mapToTemplate = (d: any) => ({
      name: d.name,
      specialty: d.specialty,
      course: d.course,
      students: d.students,
      lecturesD: d.lecturesFullTime || 0,
      lecturesZ: d.lecturesPartTime || 0,
      practD: d.practicalsFullTime || 0,
      practZ: d.practicalsPartTime || 0,
      labsD: d.labsFullTime || 0,
      labsZ: d.labsPartTime || 0,
      consD: d.consultationsFullTime || 0,
      consZ: d.consultationsPartTime || 0,
      examD: d.examsFullTime || 0,
      examZ: d.examsPartTime || 0,
      creditD: d.creditsFullTime || 0,
      creditZ: d.creditsPartTime || 0,
      control: d.controlWorks || 0,
      courseWork: d.courseWorks || 0,
      thesis: d.thesisWorks || 0,
      practice: (d.pedPractice || 0) + (d.educationalPractice || 0) + (d.productionPractice || 0),
      postgrad: d.postgraduateStudies || 0,
      other: d.other || 0,
      total: d.totalHours || 0
    });

    const data = {
      userName: report.user.name,
      userPosition: report.user.position || 'асистент',
      userDepartment: report.user.department || 'системного проектування',
      academicYear: report.academicYear,
      departmentHead: meta.departmentHead || 'доц. Р. Я. Шувар',
      dean: meta.dean || 'доц. Ю.М. Фургала',
      semester1Disciplines: report.disciplines.filter(d => d.semester === 1).map(mapToTemplate),
      semester2Disciplines: report.disciplines.filter(d => d.semester === 2).map(mapToTemplate),
      totalHoursYear: report.disciplines.reduce((sum, d) => sum + (d.totalHours || 0), 0)
    };

    return generatePdfReport(data);
  }

  async exportToExcel(id: string, userId: string): Promise<Buffer> {
    const report = await this.getReport(id, userId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Звіт');

    const header1 = ['Дисципліна', 'Спец/Курс', 'Студ.', 'Лекції', '', 'Практ.', '', 'Лабор.', '', 'Разом'];
    const header2 = ['', '', '', 'ден.', 'заоч.', 'ден.', 'заоч.', 'ден.', 'заоч.', ''];

    worksheet.addRow(header1);
    worksheet.addRow(header2);

    worksheet.mergeCells('A1:A2');
    worksheet.mergeCells('B1:B2');
    worksheet.mergeCells('C1:C2');
    worksheet.mergeCells('D1:E1');
    worksheet.mergeCells('F1:G1');
    worksheet.mergeCells('H1:I1');
    worksheet.mergeCells('J1:J2');

    report.disciplines.forEach(d => {
      worksheet.addRow([
        d.name,
        `${d.specialty}-${d.course}`,
        d.students,
        d.lecturesFullTime, d.lecturesPartTime,
        d.practicalsFullTime, d.practicalsPartTime,
        d.labsFullTime, d.labsPartTime,
        d.totalHours
      ]);
    });

    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).alignment = { vertical: 'middle', horizontal: 'center' };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // async exportToExcel(id: string, userId: string): Promise<Buffer> {
  //   const report = await this.getReport(id, userId);
  //   const disciplines = await this.getDisciplines(id, userId);

  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Звіт');

  //   // Заголовок
  //   worksheet.mergeCells('A1:N1');
  //   worksheet.getCell('A1').value = `ПЛАН педагогічного навантаження на ${report.academicYear} н.р.`;
  //   worksheet.getCell('A1').font = { bold: true, size: 14 };
  //   worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  //   worksheet.mergeCells('A2:N2');
  //   worksheet.getCell('A2').value = `Викладача: ${report.user.name}`;
  //   worksheet.getCell('A2').font = { size: 12 };
  //   worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  //   worksheet.getRow(3).height = 5;

  //   worksheet.columns = [
  //     { width: 5 },   // №
  //     { width: 35 },  // Дисципліна
  //     { width: 15 },  // Спеціальність
  //     { width: 8 },   // Курс
  //     { width: 10 },  // Семестр
  //     { width: 15 },  // Форма навчання
  //     { width: 12 },  // К-ть студентів
  //     { width: 10 },  // Лекції
  //     { width: 12 },  // Практичні
  //     { width: 13 },  // Лабораторні
  //     { width: 13 },  // Консультації
  //     { width: 10 },  // Іспити
  //     { width: 10 },  // Заліки
  //     { width: 12 },  // Всього
  //   ];

  //   const headerRow = worksheet.getRow(4);
  //   const headers = [
  //     '№',
  //     'Дисципліна',
  //     'Спеціальність',
  //     'Курс',
  //     'Семестр',
  //     'Форма навчання',
  //     'К-ть студентів',
  //     'Лекції',
  //     'Практичні',
  //     'Лабораторні',
  //     'Консультації',
  //     'Іспити',
  //     'Заліки',
  //     'Всього год.'
  //   ];

  //   headers.forEach((header, index) => {
  //     const cell = headerRow.getCell(index + 1);
  //     cell.value = header;
  //     cell.font = { bold: true, size: 11 };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFD3D3D3' },
  //     };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //     cell.border = {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' },
  //     };
  //   });

  //   const semester1Disciplines = disciplines.filter(d => d.semester === 1);
  //   const semester2Disciplines = disciplines.filter(d => d.semester === 2);

  //   let rowIndex = 5;
  //   let disciplineNumber = 1;

  //   // Семестр 1
  //   if (semester1Disciplines.length > 0) {
  //     // Заголовок семестру
  //     worksheet.mergeCells(`A${rowIndex}:N${rowIndex}`);
  //     const semesterRow = worksheet.getRow(rowIndex);
  //     semesterRow.getCell(1).value = 'І СЕМЕСТР';
  //     semesterRow.getCell(1).font = { bold: true, size: 11, italic: true };
  //     semesterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  //     semesterRow.getCell(1).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFE8E8E8' },
  //     };
  //     rowIndex++;

  //     // Дані дисциплінів семестру 1
  //     for (const disc of semester1Disciplines) {
  //       const row = worksheet.getRow(rowIndex);

  //       row.getCell(1).value = disciplineNumber++;
  //       row.getCell(2).value = disc.name;
  //       row.getCell(3).value = disc.specialty;
  //       row.getCell(4).value = disc.course;
  //       row.getCell(5).value = disc.faculty;
  //       row.getCell(5).value = '1';
  //       row.getCell(6).value = disc.studyForm === 'FULL_TIME' ? 'Денна' : 'Заочна';
  //       row.getCell(7).value = disc.studentsCount;
  //       row.getCell(8).value = disc.lectures;
  //       row.getCell(9).value = disc.practicals;
  //       row.getCell(10).value = disc.labs;
  //       row.getCell(11).value = disc.consultations;
  //       row.getCell(12).value = disc.exams;
  //       row.getCell(13).value = disc.credits;
  //       row.getCell(14).value = disc.totalHours;

  //       this.formatDataRow(row);
  //       rowIndex++;
  //     }

  //     // Підсумок семестру 1
  //     const total1 = semester1Disciplines.reduce((sum, d) => sum + d.totalHours, 0);
  //     worksheet.mergeCells(`A${rowIndex}:M${rowIndex}`);
  //     const totalRow1 = worksheet.getRow(rowIndex);
  //     totalRow1.getCell(1).value = 'Всього за І семестр:';
  //     totalRow1.getCell(1).font = { bold: true, size: 11 };
  //     totalRow1.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  //     totalRow1.getCell(1).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFFFEB99' },
  //     };
  //     totalRow1.getCell(14).value = total1;
  //     totalRow1.getCell(14).font = { bold: true, size: 11 };
  //     totalRow1.getCell(14).alignment = { horizontal: 'center', vertical: 'middle' };
  //     totalRow1.getCell(14).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFFFEB99' },
  //     };
  //     for (let i = 1; i <= 14; i++) {
  //       totalRow1.getCell(i).border = {
  //         top: { style: 'double' },
  //         left: { style: 'thin' },
  //         bottom: { style: 'double' },
  //         right: { style: 'thin' },
  //       };
  //     }
  //     rowIndex += 2;
  //   }

  //   // Семестр 2
  //   if (semester2Disciplines.length > 0) {
  //     // Заголовок семестру
  //     worksheet.mergeCells(`A${rowIndex}:N${rowIndex}`);
  //     const semesterRow = worksheet.getRow(rowIndex);
  //     semesterRow.getCell(1).value = 'ІІ СЕМЕСТР';
  //     semesterRow.getCell(1).font = { bold: true, size: 11, italic: true };
  //     semesterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  //     semesterRow.getCell(1).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFE8E8E8' },
  //     };
  //     rowIndex++;

  //     // Дані дисциплінів семестру 2
  //     for (const disc of semester2Disciplines) {
  //       const row = worksheet.getRow(rowIndex);

  //       row.getCell(1).value = disciplineNumber++;
  //       row.getCell(2).value = disc.name;
  //       row.getCell(3).value = disc.specialty;
  //       row.getCell(4).value = disc.course;
  //       row.getCell(5).value = '2';
  //       row.getCell(6).value = disc.studyForm === 'FULL_TIME' ? 'Денна' : 'Заочна';
  //       row.getCell(7).value = disc.studentsCount;
  //       row.getCell(8).value = disc.lectures;
  //       row.getCell(9).value = disc.practicals;
  //       row.getCell(10).value = disc.labs;
  //       row.getCell(11).value = disc.consultations;
  //       row.getCell(12).value = disc.exams;
  //       row.getCell(13).value = disc.credits;
  //       row.getCell(14).value = disc.totalHours;

  //       this.formatDataRow(row);
  //       rowIndex++;
  //     }

  //     // Підсумок семестру 2
  //     const total2 = semester2Disciplines.reduce((sum, d) => sum + d.totalHours, 0);
  //     worksheet.mergeCells(`A${rowIndex}:M${rowIndex}`);
  //     const totalRow2 = worksheet.getRow(rowIndex);
  //     totalRow2.getCell(1).value = 'Всього за ІІ семестр:';
  //     totalRow2.getCell(1).font = { bold: true, size: 11 };
  //     totalRow2.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  //     totalRow2.getCell(1).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFFFEB99' },
  //     };
  //     totalRow2.getCell(14).value = total2;
  //     totalRow2.getCell(14).font = { bold: true, size: 11 };
  //     totalRow2.getCell(14).alignment = { horizontal: 'center', vertical: 'middle' };
  //     totalRow2.getCell(14).fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFFFEB99' },
  //     };
  //     for (let i = 1; i <= 14; i++) {
  //       totalRow2.getCell(i).border = {
  //         top: { style: 'double' },
  //         left: { style: 'thin' },
  //         bottom: { style: 'double' },
  //         right: { style: 'thin' },
  //       };
  //     }
  //     rowIndex += 2;
  //   }

  //   // Загальний підсумок
  //   worksheet.mergeCells(`A${rowIndex}:M${rowIndex}`);
  //   const grandTotalRow = worksheet.getRow(rowIndex);
  //   grandTotalRow.getCell(1).value = 'РАЗОМ за рік:';
  //   grandTotalRow.getCell(1).font = { bold: true, size: 12 };
  //   grandTotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  //   grandTotalRow.getCell(1).fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: 'FFC6EFCE' },
  //   };

  //   const totalHours = disciplines.reduce((sum, d) => sum + d.totalHours, 0);
  //   grandTotalRow.getCell(14).value = totalHours;
  //   grandTotalRow.getCell(14).font = { bold: true, size: 12 };
  //   grandTotalRow.getCell(14).alignment = { horizontal: 'center', vertical: 'middle' };
  //   grandTotalRow.getCell(14).fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: 'FFC6EFCE' },
  //   };

  //   for (let i = 1; i <= 14; i++) {
  //     grandTotalRow.getCell(i).border = {
  //       top: { style: 'double' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'double' },
  //       right: { style: 'thin' },
  //     };
  //   }

  //   const arrayBuffer = await workbook.xlsx.writeBuffer();
  //   return Buffer.from(arrayBuffer);
  // }

  private formatDataRow(row: any) {
    for (let i = 1; i <= 14; i++) {
      const cell = row.getCell(i);
      cell.alignment = {
        horizontal: i === 2 ? 'left' : 'center',
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }

  async deleteReport(id: string, userId: string) {
    await this.getReport(id, userId);

    return this.prisma.report.delete({
      where: { id },
    });
  }
}