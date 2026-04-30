import puppeteer from 'puppeteer';

export interface DisciplineData {
  name: string;
  specialty?: string;
  course?: number;
  students?: number;
  lecturesD: number;
  lecturesZ: number;
  practD: number;
  practZ: number;
  labsD: number;
  labsZ: number;
  consD: number;
  consZ: number;
  examD: number;
  examZ: number;
  creditD: number;
  creditZ: number;
  control: number;
  courseWork: number;
  thesis: number;
  practice: number;
  postgrad: number;
  other: number;
  total: number;
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
  function renderTable(disciplines: any[], title: string) {
    if (disciplines.length === 0) return '';

    const rows = disciplines.map(d => `
    <tr>
      <td style="text-align:left">${d.name}</td>
      <td>${d.specialty}-${d.course}</td>
      <td>${d.students}</td>
      <td>${d.lecturesD}</td><td>${d.lecturesZ}</td>
      <td>${d.practD}</td><td>${d.practZ}</td>
      <td>${d.labsD}</td><td>${d.labsZ}</td>
      <td>${d.consD}</td><td>${d.consZ}</td>
      <td>${d.examD}</td><td>${d.examZ}</td>
      <td>${d.creditD}</td><td>${d.creditZ}</td>
      <td>${d.control}</td>
      <td>${d.courseWork}</td>
      <td>${d.practice}</td>
      <td>${d.postgrad}</td>
      <td>${d.other}</td>
      <td class="total-cell">${d.total}</td>
    </tr>
  `).join('');

    return `
    <h3>${title}</h3>
    <table>
      <thead>
        <tr>
          <th rowspan="2">Дисципліна</th>
          <th rowspan="2">Спец, курс</th>
          <th rowspan="2">Студ.</th>
          <th colspan="2">Лекції</th>
          <th colspan="2">Практ.</th>
          <th colspan="2">Лабор.</th>
          <th colspan="2">Конс.</th>
          <th colspan="2">Іспит</th>
          <th colspan="2">Залік</th>
          <th rowspan="2">Контр.</th>
          <th rowspan="2">Курс.</th>
          <th rowspan="2">Практ.</th>
          <th rowspan="2">Асп.</th>
          <th rowspan="2">Інше</th>
          <th rowspan="2">Разом</th>
        </tr>
        <tr>
          <th>д</th><th>з</th><th>д</th><th>з</th><th>д</th><th>з</th>
          <th>д</th><th>з</th><th>д</th><th>з</th><th>д</th><th>з</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  }

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