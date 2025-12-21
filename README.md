# Web-ToDo-application
# Task Manager Pro (Web ToDo Application)

Клієнтський вебзастосунок для створення та розподілу задач (тікетів) між учасниками команди.
Підтримує Kanban-дошку, список задач, аналітику, фільтри та локальне збереження в LocalStorage.

## Основні можливості
- CRUD задач (створення/редагування/видалення)
- Статуси: Open / In Progress / Done
- Drag & Drop між колонками (Kanban)
- Користувачі (учасники команди) + призначення виконавця
- Пошук і фільтри (status / assignee / priority / tags)
- Checklist та коментарі (за наявності в реалізації)
- Analytics (Chart.js)
- Export/Import JSON (резервне копіювання)

## Технології
- HTML / CSS / JavaScript (front-end only)
- Bootstrap, Font Awesome
- Day.js, Chart.js
- Sortable.js (drag&drop)
- LocalStorage (збереження стану)

## Запуск
### Вариант A: просто відкрити
1. Відкрити `index.html` у браузері.

### Вариант B: через локальний сервер (рекомендовано)
- VS Code Live Server
або
```bash
npx http-server .
