import TelegramBot from "node-telegram-bot-api";
import axios, { AxiosResponse } from "axios";
import { Issue, IssueContent } from "./types";
import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, CHAT_ID, REDMINE_API_KEY, BASE_URL, TARGET_URL } =
  process.env;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN as string, { polling: false });
const request = `${BASE_URL}${TARGET_URL}/issues.json?key=${REDMINE_API_KEY}&status_id!=5`;

let currentIssuesList: Issue[] = [];

async function initializeCurrentIssuesList(): Promise<void> {
  try {
    const response: AxiosResponse = await axios.get(request);
    currentIssuesList = response.data.issues;
    console.log(currentIssuesList);
  } catch (error) {
    console.error("Ошибка при инициализации списка задач из Redmine:", error);
  }
}

async function getRedmineUpdatesAndNotify(): Promise<void> {
  try {
    const response: AxiosResponse = await axios.get(request);
    const newIssuesList = response.data.issues;
    console.log(
      "---------------------------------------------------\n" +
        "--------------------Новый массив-------------------\n" +
        "---------------------------------------------------\n"
    );
    console.log(newIssuesList);

    if (JSON.stringify(currentIssuesList) !== JSON.stringify(newIssuesList)) {
      // Обнаружены изменения
      newIssuesList.forEach((issue: Issue) => {
        if (
          !currentIssuesList.some(
            (currentIssue) => currentIssue.id === issue.id
          )
        ) {
          notifyNewIssue(issue);
        } else {
          const currentIssue = currentIssuesList.find(
            (currentIssue) => currentIssue.id === issue.id
          );
          if (
            ((currentIssue as Issue).status as unknown as IssueContent).name !==
            ((issue as Issue).status as unknown as IssueContent).name
          ) {
            notifyStatusUpdate(
              issue,
              ((currentIssue as Issue).status as unknown as IssueContent).name
            );
          } else if ((currentIssue as Issue).updated_on !== issue.updated_on) {
            notifyIssueUpdate(issue);
          }
        }
      });
      currentIssuesList = newIssuesList;
    }
  } catch (error) {
    console.error("Ошибка при получении обновлений из Redmine:", error);
  }
}

function notifyNewIssue(issue: Issue): void {
  const message: string = `Добавлена новая задача #${issue.id} - ${issue.subject}\n${BASE_URL}/issues/${issue.id}`;
  const status = (issue.priority as unknown as IssueContent).id;
  if (status === 3) {
    bot.sendMessage(CHAT_ID as string, "\u{1F7E6}" + message + "\u{1F7E6}", {parse_mode: "HTML"});
  } else if (status === 4) {
    bot.sendMessage(CHAT_ID as string, "\u{1F7E5}" + message + "\u{1F7E5}", {parse_mode: "HTML"});
  } else if (status === 5) {
    bot.sendMessage(CHAT_ID as string, "\u{2B1B}" + message + "\u{2B1B}", {parse_mode: "HTML"});
  } else {
    bot.sendMessage(CHAT_ID as string, message);
  }
}

function notifyStatusUpdate(issue: Issue, oldStatus: string): void {
  const message: string = `В задаче #${
    issue.id
  } изменён статус с: "${oldStatus}" на "${
    (issue.status as unknown as IssueContent).name
  }"\n${BASE_URL}/issues/${issue.id}`;
  bot.sendMessage(CHAT_ID as string, message);
}

function notifyIssueUpdate(issue: Issue): void {
  const message: string = `Обновление в задаче #${issue.id}\n${BASE_URL}/issues/${issue.id}`;
  bot.sendMessage(CHAT_ID as string, message);
}

initializeCurrentIssuesList().then(() => {
  setInterval(getRedmineUpdatesAndNotify, 60000);
  console.log("Бот запущен. Ожидание обновлений из Redmine.");
  bot.sendMessage(
    CHAT_ID as string,
    "Бот успешно запущен и готов к работе!"
  );
});
