import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as mammoth from 'mammoth';
const PDFParser = require('pdf2json');

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) { }

  async processDocument(
    file: Express.Multer.File,
    userId: string,
    academicYear: string,) {
    const report = await this.prisma.report.create({
      data: {
        userId,
        academicYear,
        originalFileName: file.originalname,
        filePath: file.path, status: 'DRAFT',
      },
    });

    try {
      let extractedText = '';

      if (file.mimetype === 'application/pdf') {
        extractedText = await this.extractTextFromPdf(file.path);
      }
      else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await this.extractTextFromDocx(file.path);
      }

      await this.prisma.report.update({
        where: { id: report.id },
        data: { rawData: { text: extractedText } },
      });
      return {
        reportId: report.id,
        fileName: file.originalname,
        status: 'uploaded',
      };
    } catch (error) {
      throw new BadRequestException(`Помилка обробки файлу: ${error.message}`);
    }
  }

  async parseDocument(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report)
      throw new BadRequestException('Звіт не знайдено');

    const rawText = (report.rawData as any)?.text;

    if (!rawText)
      throw new BadRequestException('Немає тексту для парсингу');

    const parsedData = this.parseFullTable(rawText);

    if (!parsedData || parsedData.length === 0) {
      throw new BadRequestException('Не вдалося розпарсити документ.');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        parsedData: { disciplines: parsedData },
        status: 'PARSED',
      },
    });

    for (const d of parsedData) {
      await this.prisma.discipline.create({ data: { reportId, ...d }, });
    }

    return {
      reportId,
      count: parsedData.length,
      status: 'parsed',
    };
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error(errData.parserError));
      });
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          let text = '';
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page) => {
              page.Texts?.forEach((t) => {
                t.R?.forEach((r) => {
                  if (r.T) text += decodeURIComponent(r.T) + ' ';
                });
              });

              text += '\n';
            });
          }

          resolve(text);
        }
        catch (error) {
          reject(error);
        }
      });

      pdfParser.loadPDF(filePath);
    });
  }

  private async extractTextFromDocx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private parseFullTable(text: string): any[] {
    const cleaned = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    const firstSemesterEnd = cleaned.indexOf('Всього за І семестр');

    const disciplineRegex = /(.*?)\s+Ел\.\s+(\d{3}-\d)\s*([\d\s]*)/g;

    const disciplines: any[] = [];

    const matches = [...cleaned.matchAll(disciplineRegex)];

    for (const m of matches) {
      const rawName = (m[1] || '').trim();
      const specialty = m[2];
      const numbersRaw = m[3] || '';
      const matchIndex = m.index ?? 0;

      const semester = firstSemesterEnd !== -1 && matchIndex > firstSemesterEnd ? 2 : 1;

      const name = this.normalizeDisciplineName(rawName, disciplines.length === 0,);

      if (!name) continue;

      const numbers = numbersRaw.match(/\d+/g)?.map(Number) || [];

      const course = Number(specialty.split('-')[1]);

      const hasPartTime = numbers.length > 10;

      if (hasPartTime) {
        const mid = Math.floor(numbers.length / 2);

        const fullTimeNumbers = numbers.slice(0, mid);
        const studentsCountFT = fullTimeNumbers[0] || 0;
        const totalHoursFT = fullTimeNumbers.length > 1 ? fullTimeNumbers[fullTimeNumbers.length - 1] : 0;

        disciplines.push({
          name,
          faculty: 'Ел.',
          specialty,
          course,
          semester,
          studyForm: 'FULL_TIME',
          studentsCount: studentsCountFT,
          lectures: fullTimeNumbers[1] || 0,
          practicals: fullTimeNumbers[2] || 0,
          labs: fullTimeNumbers[3] || 0,
          consultations: fullTimeNumbers[4] || 0,
          exams: fullTimeNumbers[5] || 0,
          credits: fullTimeNumbers[6] || 0,
          controlWorks: 0,
          courseWorks: /курсов/i.test(name) ? totalHoursFT : 0,
          thesisWorks: /дипл/i.test(name) ? totalHoursFT : 0,
          totalHours: totalHoursFT,
        });

        const partTimeNumbers = numbers.slice(mid);
        const studentsCountPT = partTimeNumbers[0] || 0;
        const totalHoursPT = partTimeNumbers.length > 1 ? partTimeNumbers[partTimeNumbers.length - 1] : 0;

        disciplines.push({
          name,
          faculty: 'Ел.',
          specialty,
          course,
          semester,
          studyForm: 'PART_TIME',
          studentsCount: studentsCountPT,
          lectures: partTimeNumbers[1] || 0,
          practicals: partTimeNumbers[2] || 0,
          labs: partTimeNumbers[3] || 0,
          consultations: partTimeNumbers[4] || 0,
          exams: partTimeNumbers[5] || 0,
          credits: partTimeNumbers[6] || 0,
          controlWorks: 0,
          courseWorks: /курсов/i.test(name) ? totalHoursPT : 0,
          thesisWorks: /дипл/i.test(name) ? totalHoursPT : 0,
          totalHours: totalHoursPT,
        });
      } else {
        const studentsCount = numbers[0] || 0;
        const totalHours = numbers.length ? 1 : 0;

        disciplines.push({
          name,
          faculty: 'Ел.',
          specialty,
          course,
          semester,
          studyForm: 'FULL_TIME',
          studentsCount,
          lectures: numbers[1] || 0,
          practicals: numbers[2] || 0,
          labs: numbers[3] || 0,
          consultations: numbers[4] || 0,
          exams: numbers[5] || 0,
          credits: numbers[6] || 0,
          controlWorks: 0,
          courseWorks: /курсов/i.test(name) ? totalHours : 0,
          thesisWorks: /дипл/i.test(name) ? totalHours : 0,
          totalHours,
        });
      }
    }
    return disciplines;
  }

  private normalizeDisciplineName(rawName: string, isFirstDiscipline: boolean,): string | null {
    let name = rawName;

    if (isFirstDiscipline) {

      const headerMarkers = [
        'Різне',
        'Заняття з асп.',
        'ДЕК',
        'Виробн. практика',
        'Навчальна практика',
        'Педпрактика',
        'Дипл. роботи',
        'Курсові роботи',
        'Контр. роботи',
        'заочне',
        'денне',
        'К-ть студентів',
        'Спеціальність',
        'Факультет',
        'Дисципліни',
        'Разом',
      ];
      for (const marker of headerMarkers) {
        const idx = name.lastIndexOf(marker);
        if (idx !== -1) {
          name = name.slice(idx + marker.length).trim();
        }
      }
    }
    name = name.replace(/Всього за І семестр/gi, '')
      .replace(/Всього за ІІ семестр/gi, '')
      .replace(/Всього за рік/gi, '')
      .replace(/\bРазом\b/gi, '')
      .replace(/Викладача.*?навантаження/gi, '')
      .trim();

    name = this.cleanName(name);

    if (!name || name.length < 3
      || /^\d+$/.test(name)
      || /факультет|спеціальність|дисципліни/i.test(name)) {
      return null;
    }
    return name;
  }

  private cleanName(name: string) {
    return name.replace(/\s+/g, ' ')
      .replace(/[^\wА-Яа-яіІїЇєЄґҐ\s\-\(\)\/\.]/g, '')
      .trim();
  }
}