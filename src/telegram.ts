import TelegramBot from "node-telegram-bot-api";
import { Config } from "./config";

export const bot = new TelegramBot(Config.TELEGRAM_BOT_TOKEN, { polling: false });

export async function sendMessage(message: string, options: object = {}) {
    await bot.sendMessage(Config.CHAT_ID, message, options)
}
