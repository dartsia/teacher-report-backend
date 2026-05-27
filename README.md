# 📘 Teacher Report: Основний сервер (Backend Core)
> Це головний бекенд-сервіс (оркестратор) системи автоматизації звітності викладачів. Сервіс відповідає за бізнес-логіку, безпеку, управління базою даних та генерацію фінальних звітів. Для виконання ресурсоємного структурного аналізу PDF-документів цей сервер асинхронно взаємодіє з окремим Python-мікросервісом.

---

## 🧠 Основний функціонал

- 🛡️ Безпека: Хешування паролів (bcrypt) та управління JWT-токенами (access/refresh).
- 🗄️ База даних: Строго типізована взаємодія з PostgreSQL через Prisma ORM.
- 🔄 Координація: Прийом файлів від клієнта (Multer) та їх передача до мікросервісу розпізнавання.
- 📄 Генерація документів: Формування підсумкових звітів у форматі PDF (через Puppeteer) та XLSX (через ExcelJS).

---

## 🛠 Стек технологій

- **Фреймворк**: NestJS (v11) / Node.js
- **Мова**: TypeScript
- **ORM**: Prisma
- **База даних**: PostgreSQL
- **Генерація файлів**: Puppeteer, ExcelJS

---

## 🚀 Встановлення та локальний запуск

### 1. Клонуйте репозиторій:

```bash
git clone https://github.com/dartsia/teacher-report-backend.git
cd teacher-report-backend
```

### 2. Встановіть залежності:

```bash
npm install
```

### 3. ННалаштуйте змінні середовища:
Створіть файл .env у кореневій папці проєкту:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/teacher-report?schema=public"

JWT_SECRET="96b4433721f2b3e6e5754fdb7cc5337aa2b7209c26bd8933a9081046322b62e0"
JWT_REFRESH_SECRET="2599e3f0cb3901a2245d23422ca0d379f3d9f8d2d03ebde9cfe82c1bdf35d7ab"

PORT=3001
NODE_ENV=development

PYTHON_MICROSERVICE=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 4. Ініціалізація бази даних:
Запустіть міграції для створення таблиць у PostgreSQL:

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Запустіть сервер розробки:

```bash
npm run start
```

Сервер запуститься на `http://localhost:3001`. Swagger-документація доступна за маршрутом `/api`