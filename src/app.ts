import "dotenv/config";
import axios from "axios";
import {Issue} from "./types";
import {sendMessage} from "./telegram";
import {getCurrentTime, isWorkTime} from "./time";
import {
    isIgnore,
    addMissedIssue,
    issuesListRequest,
    getMissedIssuesList,
    getOldIssuesMap,
    assignOldIssuesMap,
    initializeCurrentIssuesList,
} from "./redmine";
import {checkNotes, delayedNotifications, notifyNewIssue, notifyStatusUpdate} from "./notifications";

const helloMessage = "Бот запущен!";

async function main(): Promise<void> {
    const now = Date.now();

    if (await isWorkTime(now) && getMissedIssuesList().length > 0) {
        await delayedNotifications();
    }

    // Сравнение списков задач на наличие изменений
    try {
        const response = (await axios.get(issuesListRequest)).data.issues;

        const newIssuesMap: Map<number, Issue> = new Map(response.map((issue: Issue) => [issue.id, issue]));

        const oldIssuesMap = getOldIssuesMap();

        console.log(`\nСравнение нового списка с инициализированным ранее ${getCurrentTime()}`);
        // Логирование для отладки
        // console.log(newIssuesMap);

        for (const [id, newIssue] of newIssuesMap) {

            const oldIssue = oldIssuesMap.get(id);

            if (!oldIssue) {
                if (!isIgnore(newIssue)) {
                    await processNewIssue(newIssue, now);
                }
            } else if (!isIgnore(newIssue) && (newIssue.status.name !== oldIssue?.status.name || newIssue.updated_on !== oldIssue?.updated_on)) {
                await processIssueUpdate(oldIssue, newIssue, now);
            }
        }
        assignOldIssuesMap(newIssuesMap);
    } catch (error) {
        console.error(`Ошибка при получении обновлений из Redmine: ${error} ${getCurrentTime()}`);
    }
}

async function processNewIssue(issue: Issue, now: number) {
    if (await isWorkTime(now)) {
        await notifyNewIssue(issue);
    } else {
        addIssueInOffTime(issue);
    }
}

async function processIssueUpdate(oldIssue: Issue, newIssue: Issue, now: number) {
    const oldStatus = oldIssue.status.name;
    const newStatus = newIssue.status.name;
    const appointed = newIssue.assigned_to?.name;

    if (await isWorkTime(now)) {
        if (oldStatus !== newStatus) {
            await notifyStatusUpdate(newIssue, oldStatus, appointed);
        }
        if (oldIssue.updated_on !== newIssue.updated_on) {
            checkNotes(newIssue);
        }
    } else {
        if (!getMissedIssuesList().includes(newIssue)) {
            addIssueInOffTime(newIssue);
        }
    }
}

function addIssueInOffTime(issue: Issue) {
    try {
        addMissedIssue(issue);
        console.log(`Во вне рабочее время изменения по задаче: ${issue.id} ${getCurrentTime()}`);
    } catch (error) {
        console.log(`При добавлении задачи во вне рабочее время произошла ошибка: ${error} ${getCurrentTime()}`);
    }
}

// Инициализируем список задач в  без оповещений, затем с интервалом в 1 мин проходимся функцией main
initializeCurrentIssuesList().then(async () => {
    console.log(`${helloMessage} ${getCurrentTime()}`);
    await sendMessage(helloMessage);
    setInterval(main, 60000);
});
