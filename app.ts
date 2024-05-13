import TelegramBot from "node-telegram-bot-api";
import axios, { AxiosResponse } from "axios";
import { Issue, IssueContent, Journal } from "./types";
import "dotenv/config";

const { TELEGRAM_BOT_TOKEN, CHAT_ID, REDMINE_API_KEY, BASE_URL } = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN as string, { polling: false });
const request = `${BASE_URL}/issues.json?key=${REDMINE_API_KEY}&status_id!=5`;
const ignored = [71060];

let weekend = false;
let currentIssuesList: Issue[] = [];
let missedIssuesList: Issue[] = [];
const helloMessage = "Бот успешно запущен и готов к работе!";
const holidays = [
  {
    start: "05-09-2024",
    end: "05-12-2024",
  },
];
let hollidayStarted = false;

const dateChecker = () => {
  const date = Date.now();
  const newDate = new Date(date);
  const day = newDate.getDay();
  const hour = newDate.getHours();
  const hollidayStartedIndex = holidays.findIndex((i) => {
    return newDate >= new Date(i.start) && newDate <= new Date(i.end);
  });

  if (hollidayStarted && hollidayStartedIndex !== -1) {
    return false;
  }

  if (hollidayStartedIndex !== -1) {
    hollidayStarted = true;
    const firstWorkDay = new Date(holidays[hollidayStartedIndex].end);
    firstWorkDay.setDate(
      new Date(holidays[hollidayStartedIndex].end).getDate() + 1
    );
    firstWorkDay.setMinutes(
      firstWorkDay.getMinutes() - firstWorkDay.getTimezoneOffset()
    );
    const firstWorkDayString = firstWorkDay
      .toISOString()
      .split("T")[0]
      .split("-")
      .reverse()
      .join("-");
    setTimeout(() => {
      bot.sendMessage(
        CHAT_ID as string,
        "Всех с праздниками, до встречи " + firstWorkDayString
      );
    }, 12 * 60 * 60 * 1000);
  } else {
    hollidayStarted = false;
  }

  if (day > 0 && day < 6 && hour < 20 && hour > 8) {
    return true;
  } else {
    return false;
  }
};

async function statusChecker(id: number) {
  const req = `${BASE_URL}/issues/${id}.json?key=${REDMINE_API_KEY}`;
  try {
    const response: AxiosResponse = await axios.get(req);
    return response.data.issue;
  } catch (error) {
    console.error("Ошибка при получении журналов", error);
  }
}

function missedChecker() {
  const actualList: number[] = [];

  if (dateChecker() && missedIssuesList.length > 0) {
    missedIssuesList.forEach((issue, index) => {
      let text = "";
      statusChecker(issue.id as number).then((res) => {
        if (
          res.status.id !== 3 &&
          res.status.id !== 5 &&
          !actualList.includes(res.id)
        ) {
          actualList.push(res.id as number);
        }

        if (index === missedIssuesList.length - 1) {
          if (actualList.length === 1) {
            text = `задаче: ${actualList[0]}`;
          } else {
            text = `задачах: ${actualList.join(", ")}`;
          }

          if (actualList.length > 0) {
            bot.sendMessage(
              CHAT_ID as string,
              "Доброе утро. За время вашего отсутствия были изменения в " + text
            );
          }
          missedIssuesList = [];
        }
      });
    });
  }
}

const ignoreFilter = (issue: Issue) => {
  if (ignored.includes(issue.id as number)) {
    return false;
  }
  return true;
};

const checkTracker = (tracker: IssueContent) => {
  if (tracker.id === 4) {
    return "\u{1F4B0}";
  } else {
    return "";
  }
};

function checkNotes(issue: Issue): void {
  getCurrentIssuesJournal(issue.id as number).then((res: void | Issue) => {
    const issueWithJornals = res;

    if ((issueWithJornals as unknown as Issue).journals) {
      const lastComment = (
        (issueWithJornals as unknown as Issue).journals as Journal[]
      ).sort((a, b) => {
        return (a.id as number) - (b.id as number);
      })[
        ((issueWithJornals as unknown as Issue).journals as Journal[]).length -
          1
      ];
      if ((lastComment.notes as string).length > 0) {
        const message: string = `${checkTracker(
          issue.tracker as unknown as IssueContent
        )}В задаче #${issue.id}${
          (issue.assigned_to as unknown as IssueContent).name &&
          (issue.assigned_to as unknown as IssueContent).name !== ""
            ? " (" + (issue.assigned_to as unknown as IssueContent).name + ") "
            : ""
        } добавлен комментарий: ${lastComment.notes}\n${BASE_URL}/issues/${
          issue.id
        }`;
        bot.sendMessage(CHAT_ID as string, message);
      }
    } else {
      notifyIssueUpdate(issue);
    }
  });
}

async function initializeCurrentIssuesList(): Promise<void> {
  try {
    const response: AxiosResponse = await axios.get(request);
    currentIssuesList = response.data.issues;
  } catch (error) {
    console.error("Ошибка при инициализации списка задач из Redmine:", error);
  }
}

async function getCurrentIssuesJournal(id: number): Promise<Issue | void> {
  const req = `${BASE_URL}/issues/${id}.json?include=journals&key=${REDMINE_API_KEY}`;
  try {
    const response: AxiosResponse = await axios.get(req);
    return response.data.issue;
  } catch (error) {
    console.error("Ошибка при получении журналов", error);
  }
}

function notifyNewIssue(issue: Issue): void {
  const message: string = `${checkTracker(
    issue.tracker as unknown as IssueContent
  )}Добавлена задача #${issue.id}${
    (issue.assigned_to as unknown as IssueContent).name &&
    (issue.assigned_to as unknown as IssueContent).name !== ""
      ? " для " + (issue.assigned_to as unknown as IssueContent).name + " "
      : ""
  } - ${issue.subject}\n${BASE_URL}/issues/${issue.id}`;
  const status = (issue.priority as unknown as IssueContent).id;

  if (status === 2) {
    bot.sendMessage(CHAT_ID as string, "\u{1F7E2}" + message, {
      parse_mode: "HTML",
    });
  } else if (status === 3) {
    bot.sendMessage(CHAT_ID as string, "\u{1F7E1}" + message, {
      parse_mode: "HTML",
    });
  } else if (status === 4) {
    bot.sendMessage(CHAT_ID as string, "\u{1F534}" + message, {
      parse_mode: "HTML",
    });
  } else if (status === 5) {
    bot.sendMessage(CHAT_ID as string, "\u{2B24}" + message, {
      parse_mode: "HTML",
    });
  } else {
    bot.sendMessage(CHAT_ID as string, message);
  }
}

function notifyStatusUpdate(
  issue: Issue,
  oldStatus: string,
  appointed: string
): void {
  const message: string = `${
    (issue.status as unknown as IssueContent).id === 2 ? "<u>" : ""
  }${checkTracker(issue.tracker as unknown as IssueContent)}В задаче #${
    issue.id
  }${
    appointed ? " (" + appointed + ") " : ""
  } изменён статус с: "${oldStatus}" на "${
    (issue.status as unknown as IssueContent).name
  }"${
    (issue.status as unknown as IssueContent).id === 2 ? "</u>" : ""
  }\n${BASE_URL}/issues/${issue.id}`;
  bot.sendMessage(CHAT_ID as string, "" + message, {
    parse_mode: "HTML",
  });
}

function notifyIssueUpdate(issue: Issue): void {
  const message: string = `${checkTracker(
    issue.tracker as unknown as IssueContent
  )}Обновление в задаче #${issue.id}${
    (issue.assigned_to as unknown as IssueContent).name &&
    (issue.assigned_to as unknown as IssueContent).name !== ""
      ? " (" + (issue.assigned_to as unknown as IssueContent).name + ") "
      : ""
  }\n${BASE_URL}/issues/${issue.id}`;
  bot.sendMessage(CHAT_ID as string, message);
}

async function getRedmineUpdatesAndNotify(): Promise<void> {
  if (!dateChecker() && !weekend) {
    weekend = true;
  }

  if (dateChecker() && weekend) {
    missedChecker();
    weekend = false;
  }
  try {
    const response: AxiosResponse = await axios.get(request);
    const newIssuesList = response.data.issues;

    if (JSON.stringify(currentIssuesList) !== JSON.stringify(newIssuesList)) {
      // Обнаружены изменения
      newIssuesList.forEach((issue: Issue) => {
        if (ignoreFilter(issue)) {
          if (
            !currentIssuesList.some(
              (currentIssue) => currentIssue.id === issue.id
            )
          ) {
            dateChecker()
              ? notifyNewIssue(issue)
              : missedIssuesList.push(issue);
          } else {
            const currentIssue = currentIssuesList.find(
              (currentIssue) => currentIssue.id === issue.id
            );

            if (
              ((currentIssue as Issue).status as unknown as IssueContent)
                .name !==
              ((issue as Issue).status as unknown as IssueContent).name
            ) {
              dateChecker()
                ? notifyStatusUpdate(
                    issue,
                    ((currentIssue as Issue).status as unknown as IssueContent)
                      .name,
                    (issue.assigned_to as unknown as IssueContent).name
                  )
                : missedIssuesList.push(issue);

              if ((currentIssue as Issue).updated_on !== issue.updated_on) {
                dateChecker()
                  ? checkNotes(currentIssue as Issue)
                  : missedIssuesList.push(issue);
              }
            } else if (
              (currentIssue as Issue).updated_on !== issue.updated_on
            ) {
              dateChecker()
                ? checkNotes(currentIssue as Issue)
                : missedIssuesList.push(issue);
            }
          }
        }
      });
      currentIssuesList = newIssuesList;
    }
  } catch (error) {
    console.error("Ошибка при получении обновлений из Redmine:", error);
  }
}

initializeCurrentIssuesList().then(() => {
  setInterval(getRedmineUpdatesAndNotify, 60000);
  console.log("Бот запущен. Ожидание обновлений из Redmine.");
  bot.sendMessage(CHAT_ID as string, "" + helloMessage);
});
