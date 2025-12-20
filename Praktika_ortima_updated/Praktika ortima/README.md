# Task Manager Pro (Web ToDo / Ticket Manager)

Клієнтський вебзастосунок для створення та розподілу задач (тікетів) між учасниками команди.
Працює **без бекенду** — дані зберігаються у **LocalStorage**. Є 3 режими перегляду: **Kanban / List / Analytics**.

## Функціонал
- CRUD для задач (створення/редагування/видалення)
- Призначення виконавця (User)
- Статуси: **Open / In Progress / Done**
- Drag&drop у Kanban (SortableJS)
- Пріоритети + дедлайни + теги
- Чеклист і коментарі в межах задачі
- Пошук і фільтри (статус/виконавець/пріоритет/теги)
- Аналітика (Chart.js)
- Журнал подій (Activity)
- Експорт/імпорт даних у JSON (backup)

## Запуск
> Через ES-модулі бажано запускати через локальний HTTP-сервер.

### Варіант 1: VS Code Live Server
1. Відкрити папку проєкту у VS Code
2. Встановити розширення **Live Server**
3. Запустити `index.html` через **Open with Live Server**

### Варіант 2: Node.js http-server
```bash
npm i -g http-server
http-server -p 8080
```
Відкрити у браузері: `http://localhost:8080`

## Тести (unit tests)
Відкрити у браузері:
`src/tests/runner.html`

## Структура проєкту
- `index.html` — основна сторінка
- `styles.css` — стилі/тема
- `src/app.js` — ініціалізація
- `src/ui.js` — рендеринг UI та обробка взаємодії
- `src/services/*` — бізнес-логіка (tasks/users/activity/persistence)
- `src/tests/*` — простий тест-ранер та тестові сценарії

## Репозиторій
GitHub: https://github.com/Seisha-web/Web-ToDo-application
