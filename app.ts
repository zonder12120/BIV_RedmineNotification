import TelegramBot from 'node-telegram-bot-api';
import axios, {AxiosResponse} from 'axios';

const telegramBotToken = '6709631142:AAHWiY1GSFaT_P2-dxCuWFQpBxCrZrpbO1w';
const chatId = '-1002064116476';
const redmineUrl = 'https://redmine.bivgroup.com/projects/sberinssupport';
const redmineApiKey = '73174af619ca4ba2f9481d46269dfb1111926d1e';
const bot = new TelegramBot(telegramBotToken, {polling: false});
const request = `${redmineUrl}/issues.json?key=${redmineApiKey}&status_id=*&limit=500`;

let currentIssuesList: any[] = [];

async function initializeCurrentIssuesList(): Promise<void> {
    try {
        const response: AxiosResponse = await axios.get(request);
        currentIssuesList = response.data.issues;
        console.log(currentIssuesList);
    } catch (error) {
        console.error('Ошибка при инициализации списка задач из Redmine:', error);
    }
}

async function getRedmineUpdatesAndNotify(): Promise<void> {
    try {
        const response: AxiosResponse = await axios.get(request);
        const newIssuesList = response.data.issues;
        console.log('---------------------------------------------------\n' +
                    '--------------------Новый массив-------------------\n' +
                    '---------------------------------------------------\n')
        console.log(newIssuesList);

        if (JSON.stringify(currentIssuesList) !== JSON.stringify(newIssuesList)) {
            // Обнаружены изменения
            newIssuesList.forEach((issue: any) => {
                if (!currentIssuesList.find((currentIssue) => currentIssue.id === issue.id)) {
                    notifyNewIssue(issue);
                } else {
                    const currentIssue = currentIssuesList.find((currentIssue) => currentIssue.id === issue.id);
                    if (currentIssue.status.name !== issue.status.name) {
                        notifyStatusUpdate(issue, currentIssue.status.name);
                    } else if (currentIssue.updated_on !== issue.updated_on) {
                        notifyIssueUpdate(issue);
                    }
                }
            });
            currentIssuesList = newIssuesList;
        }
    } catch (error) {
        console.error('Ошибка при получении обновлений из Redmine:', error);
    }
}

function notifyNewIssue(issue: any): void {
    const message: string = `Добавлена новая задача #${issue.id} - ${issue.subject}\n${redmineUrl}/issues/${issue.id}`;
    bot.sendMessage(chatId, message);
}

function notifyStatusUpdate(issue: any, oldStatus: string): void {
    const message: string = `В задаче #${issue.id} изиенён статус с: "${oldStatus}" на "${issue.status.name}"\n${redmineUrl}/issues/${issue.id}`;
    bot.sendMessage(chatId, message);
}

function notifyIssueUpdate(issue: any): void {
    const message: string = `Обновление в задаче #${issue.id}\n${redmineUrl}/issues/${issue.id}`;
    bot.sendMessage(chatId, message);
}

initializeCurrentIssuesList().then(() => {
    setInterval(getRedmineUpdatesAndNotify, 60000);
    console.log('Бот запущен. Ожидание обновлений из Redmine.');
    bot.sendMessage(chatId, 'Бот успешно запущен и готов к работе!');
});
