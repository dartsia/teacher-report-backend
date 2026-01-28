import puppeteer from 'puppeteer';

export interface DisciplineData {
  name: string;
  specialty: string;
  course: number;
  faculty: string;
  semester: number;
  students: number;
  lecturesFullTime: number;
  lecturesPartTime: number;
  practicalsFullTime: number;
  practicalsPartTime: number;
  labsFullTime: number;
  labsPartTime: number;
  consultationsFullTime: number;
  consultationsPartTime: number;
  examsFullTime: number;
  examsPartTime: number;
  creditsFullTime: number;
  creditsPartTime: number;
  controlWorks: number;
  courseWorks: number;
  thesisWorks: number;
  pedPractice: number;
  educationalPractice: number;
  productionPractice: number;
  stateExams: number;
  postgraduateStudies: number;
  other: number;
  totalHours: number;
}

export interface ReportData {
  userName: string;
  userPosition: string;
  userDepartment: string;
  academicYear: string;
  departmentHead: string;
  dean: string;
  semester1Disciplines: DisciplineData[];
  semester2Disciplines: DisciplineData[];
}

export async function generatePdfReport(data: ReportData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(generateHtml(data), { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateHtml(data: ReportData): string {
  const renderTable = (disciplines: DisciplineData[], title: string) => {
    if (disciplines.length === 0) return '';

    const sums = {
      students: disciplines.reduce((a, b) => a + b.students, 0),
      lecturesFull: disciplines.reduce((a, b) => a + b.lecturesFullTime, 0),
      lecturesPart: disciplines.reduce((a, b) => a + b.lecturesPartTime, 0),
      total: disciplines.reduce((a, b) => a + b.totalHours, 0),
    };

    return `
      <div class="semester-section">
        <div class="semester-header">${title}</div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 15%;">Дисципліни</th>
              <th rowspan="2" class="v-text"><div>Факультет</div></th>
              <th rowspan="2" class="v-text"><div>Спеціальність, курс</div></th>
              <th rowspan="2" class="v-text"><div>К-ть студентів</div></th>
              <th colspan="2">Лекції</th>
              <th colspan="2">Практ.</th>
              <th colspan="2">Лабор.</th>
              <th colspan="2">Конс.</th>
              <th colspan="2">Іспити</th>
              <th colspan="2">Заліки</th>
              <th rowspan="2" class="v-text"><div>Контр. роботи</div></th>
              <th rowspan="2" class="v-text"><div>Курсові роботи</div></th>
              <th rowspan="2" class="v-text"><div>Дипл. роботи</div></th>
              <th rowspan="2" class="v-text"><div>Педпрактика</div></th>
              <th rowspan="2" class="v-text"><div>Навчальна практика</div></th>
              <th rowspan="2" class="v-text"><div>Виробн. практика</div></th>
              <th rowspan="2" class="v-text"><div>ДЕК</div></th>
              <th rowspan="2" class="v-text"><div>Заняття з асп.</div></th>
              <th rowspan="2" class="v-text"><div>Різне</div></th>
              <th rowspan="2" class="v-text"><div>Разом</div></th>
            </tr>
            <tr>
              <th class="mini">д</th><th class="mini">з</th>
              <th class="mini">д</th><th class="mini">з</th>
              <th class="mini">д</th><th class="mini">з</th>
              <th class="mini">д</th><th class="mini">з</th>
              <th class="mini">д</th><th class="mini">з</th>
              <th class="mini">д</th><th class="mini">з</th>
            </tr>
          </thead>
          <tbody>
            ${disciplines.map(d => `
              <tr>
                <td class="left-align">${d.name}</td>
                <td>${d.faculty}</td>
                <td>${d.specialty}-${d.course}</td>
                <td>${d.students || ''}</td>
                <td>${d.lecturesFullTime || ''}</td><td>${d.lecturesPartTime || ''}</td>
                <td>${d.practicalsFullTime || ''}</td><td>${d.practicalsPartTime || ''}</td>
                <td>${d.labsFullTime || ''}</td><td>${d.labsPartTime || ''}</td>
                <td>${d.consultationsFullTime || ''}</td><td>${d.consultationsPartTime || ''}</td>
                <td>${d.examsFullTime || ''}</td><td>${d.examsPartTime || ''}</td>
                <td>${d.creditsFullTime || ''}</td><td>${d.creditsPartTime || ''}</td>
                <td>${d.controlWorks || ''}</td>
                <td>${d.courseWorks || ''}</td>
                <td>${d.thesisWorks || ''}</td>
                <td>${d.pedPractice || ''}</td>
                <td>${d.educationalPractice || ''}</td>
                <td>${d.productionPractice || ''}</td>
                <td>${d.stateExams || ''}</td>
                <td>${d.postgraduateStudies || ''}</td>
                <td>${d.other || ''}</td>
                <td class="bold">${d.totalHours}</td>
              </tr>
            `).join('')}
            <tr class="sum-row">
              <td colspan="3" class="right-align">Всього за ${title.toLowerCase()}:</td>
              <td>${sums.students}</td>
              <td>${sums.lecturesFull}</td><td>${sums.lecturesPart}</td>
              <td colspan="18"></td>
              <td class="bold">${sums.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: "Times New Roman", serif; font-size: 8px; color: black; line-height: 1.1; }
        .header-block { text-align: center; margin-bottom: 10px; }
        .title { font-size: 14px; font-weight: bold; }
        .info-block { margin-bottom: 15px; font-size: 10px; }
        
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 0.5pt solid black; text-align: center; overflow: hidden; }
        th { background-color: #f2f2f2; height: 100px; }
        td { height: 18px; }
        
        .v-text { position: relative; padding: 0 !important; }
        .v-text div { 
          writing-mode: vertical-rl; 
          transform: rotate(180deg); 
          white-space: nowrap; 
          display: inline-block; 
          font-size: 7px;
          margin: 0 auto;
        }
        
        .mini { width: 12px; font-size: 7px; }
        .left-align { text-align: left; padding-left: 3px; white-space: nowrap; text-overflow: ellipsis; }
        .right-align { text-align: right; padding-right: 5px; font-weight: bold; }
        .bold { font-weight: bold; }
        .semester-header { text-align: center; font-weight: bold; font-size: 10px; margin: 5px 0; background: #e8e8e8; }
        .sum-row { background-color: #fafafa; }

        .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 9px; }
        .sign-box { width: 30%; text-align: center; }
        .sign-line { border-top: 1px solid black; margin-top: 25px; margin-bottom: 3px; }
      </style>
    </head>
    <body>
      <div class="header-block">
        <div>Львівський національний університет імені Івана Франка</div>
        <div class="title">ПЛАН</div>
        <div>педагогічного навантаження на ${data.academicYear} н.р.</div>
      </div>

      <div class="info-block">
        Викладача: <b>${data.userName}</b>, ${data.userPosition}<br>
        кафедри ${data.userDepartment}
      </div>

      ${renderTable(data.semester1Disciplines, "І СЕМЕСТР")}
      ${renderTable(data.semester2Disciplines, "ІІ СЕМЕСТР")}

      <div class="footer">
        <div class="sign-box">
          "ЗАТВЕРДЖУЮ"<br>Декан факультету електроніки<br>та комп'ютерних технологій
          <div class="sign-line"></div>
          ${data.dean}
        </div>
        <div class="sign-box">
          "ЗАТВЕРДЖУЮ"<br>Завідувач кафедри<br>${data.userDepartment}
          <div class="sign-line"></div>
          ${data.departmentHead}
        </div>
        <div class="sign-box">
          <br>Підпис викладача
          <div class="sign-line"></div>
          "___" __________ 2025 р.
        </div>
      </div>
    </body>
    </html>
  `;
} 