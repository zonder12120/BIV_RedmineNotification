import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, CHAT_ID, REDMINE_API_KEY, BASE_URL, GOOGLE_CALENDAR_KEY} = process.env;

// BASE_URL - basic url address like https://redmine.your-company.com

// Проверка наличия переменных окружения, при добавлении новых нужно добавлять сюда, если обязательные
if (!TELEGRAM_BOT_TOKEN || !CHAT_ID || !REDMINE_API_KEY || !BASE_URL || !GOOGLE_CALENDAR_KEY) {
    throw new Error(
        "Отсутствуют необходимые переменные окружения. Пожалуйста, убедитесь, что все переменные окружения установлены."
    );
}

export const Config = {
    TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN,
    CHAT_ID: CHAT_ID,
    REDMINE_API_KEY: REDMINE_API_KEY,
    BASE_URL: BASE_URL,
    GOOGLE_CALENDAR_KEY: GOOGLE_CALENDAR_KEY,
};
