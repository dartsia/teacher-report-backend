import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

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

  async updateDiscipline(id: string, data: UpdateDisciplineDto, userId: string) {
    console.log('Updating discipline', id, 'with data:', data);
    const discipline = await this.prisma.discipline.findUnique({
      where: { id },
      include: { report: true },
    });

    if (!discipline) {
      console.log('Discipline not found for id:', id);
      throw new NotFoundException('Дисципліну не знайдено');
    }

    if (discipline.report.userId !== userId) {
      console.log('User', userId, 'is not authorized to update discipline', id);
      throw new ForbiddenException('У вас немає доступу до цієї дисципліни');
    }

    const totalHours = 
      (data.lectures ?? discipline.lectures) +
      (data.practicals ?? discipline.practicals) +
      (data.labs ?? discipline.labs) +
      (data.consultations ?? discipline.consultations) +
      (data.exams ?? discipline.exams) +
      (data.credits ?? discipline.credits);

    console.log('Updating discipline', id, 'with totalHours:', totalHours);

    return this.prisma.discipline.update({
      where: { id },
      data: {
        ...data,
        totalHours,
      },
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

  async addDiscipline(reportId: string, data: UpdateDisciplineDto, userId: string) {
    await this.getReport(reportId, userId);

    const totalHours = 
      (data.lectures || 0) +
      (data.practicals || 0) +
      (data.labs || 0) +
      (data.consultations || 0) +
      (data.exams || 0) +
      (data.credits || 0);

    return this.prisma.discipline.create({
      data: {
        reportId,
        name: data.name || '',
        faculty: data.faculty || '',
        specialty: data.specialty || '',
        course: data.course || 1,
        semester: data.semester || 1,
        studentsCount: data.studentsCount || 0,
        lectures: data.lectures || 0,
        practicals: data.practicals || 0,
        labs: data.labs || 0,
        consultations: data.consultations || 0,
        exams: data.exams || 0,
        credits: data.credits || 0,
        controlWorks: data.controlWorks || 0,
        courseWorks: data.courseWorks || 0,
        thesisWorks: data.thesisWorks || 0,
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
    const report = await this.getReport(id, userId);
    const disciplines = await this.getDisciplines(id, userId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('ПЛАН педагогічного навантаження', { align: 'center' });
      doc.fontSize(12).text(`Викладача: ${report.user.name}`, { align: 'center' });
      doc.fontSize(10).text(`Навчальний рік: ${report.academicYear}`, { align: 'center' });
      doc.moveDown(2);

      disciplines.forEach((disc, index) => {
        doc.fontSize(10);
        doc.text(`${index + 1}. ${disc.name}`);
        doc.fontSize(8);
        doc.text(`   Спеціальність: ${disc.specialty}, Курс: ${disc.course}`);
        doc.text(`   Студентів: ${disc.studentsCount}`);
        doc.text(`   Години: Лекції-${disc.lectures}, Практ-${disc.practicals}, Лаб-${disc.labs}`);
        doc.text(`   Всього: ${disc.totalHours} год.`);
        doc.moveDown(0.5);
      });

      const totalHours = disciplines.reduce((sum, d) => sum + d.totalHours, 0);
      doc.moveDown(1);
      doc.fontSize(12).text(`Загальна кількість годин: ${totalHours}`, { align: 'right' });

      doc.end();
    });
  }

  async exportToExcel(id: string, userId: string): Promise<Buffer> {
    const report = await this.getReport(id, userId);
    const disciplines = await this.getDisciplines(id, userId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Звіт');

    worksheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Дисципліна', key: 'name', width: 30 },
      { header: 'Спеціальність', key: 'specialty', width: 15 },
      { header: 'Курс', key: 'course', width: 8 },
      { header: 'Студентів', key: 'students', width: 10 },
      { header: 'Лекції', key: 'lectures', width: 10 },
      { header: 'Практичні', key: 'practicals', width: 10 },
      { header: 'Лабораторні', key: 'labs', width: 12 },
      { header: 'Консультації', key: 'consultations', width: 12 },
      { header: 'Іспити', key: 'exams', width: 10 },
      { header: 'Заліки', key: 'credits', width: 10 },
      { header: 'Всього годин', key: 'total', width: 12 },
    ];

    disciplines.forEach((disc, index) => {
      worksheet.addRow({
        num: index + 1,
        name: disc.name,
        specialty: disc.specialty,
        course: disc.course,
        students: disc.studentsCount,
        lectures: disc.lectures,
        practicals: disc.practicals,
        labs: disc.labs,
        consultations: disc.consultations,
        exams: disc.exams,
        credits: disc.credits,
        total: disc.totalHours,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteReport(id: string, userId: string) {
    await this.getReport(id, userId);

    return this.prisma.report.delete({
      where: { id },
    });
  }
}