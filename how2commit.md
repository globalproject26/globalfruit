# How to commit

1. Проверь изменения:
   git status -sb
2. Добавь нужные файлы в индекс:
   git add app.js .gitignore how2commit.md
3. Сделай коммит:
   git commit -m "Update refresh interval and ignore history"
4. Отправь в GitHub:
   git push origin main

Если нужно отправить все изменения в проекте, вместо шага 2 используй:
   git add -A

Если хочешь отменить добавление файла в индекс:
   git restore --staged <path>
