# Crypto Watch Bot

Telegram-бот для отслеживания изменений цен криптовалют (Binance) — multi-user.

## Установка
1. Склонируйте репозиторий
2. npm install
3. Создайте `.env` на основе `.env.example`
4. npm run migrate
5. npm run dev

## Команды Telegram
/start - приветствие
/add - добавить правило (пример: `/add BTCUSDT up 2`)
/list - показать правила
/remove <id> - удалить правило
/toggle <id> - включить/выключить правило

## Архитектура
- better-sqlite3
- Telegraf
- Binance WebSocket
- P-Queue для очереди уведомлений
- Pino для логов
