import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, CHAT_ID, REDMINE_API_KEY, BASE_URL, GOOGLE_CALENDAR_KEY} = process.env;

if (!TELEGRAM_BOT_TOKEN || !CHAT_ID || !REDMINE_API_KEY || !BASE_URL || !GOOGLE_CALENDAR_KEY) {
    throw new Error(
        "Отсутствуют необходимые переменные окружения. Пожалуйста, убедитесь, что все переменные окружения установлены."
    );
}

export const Config = {
    TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN as string,
    CHAT_ID: CHAT_ID as string,
    REDMINE_API_KEY: REDMINE_API_KEY as string,
    BASE_URL: BASE_URL as string,
    GOOGLE_CALENDAR_KEY: GOOGLE_CALENDAR_KEY as string,
};
