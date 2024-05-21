import axios, {AxiosResponse} from "axios";
import {Issue, IssueContent} from "./types";
import "dotenv/config";
import {getCurrentTime, isWorkTime} from "./time";
import {
    addMissedIssue,
    assignCurrentIssuesList,
    getCurrentIssuesList,
    ignoreFilter,
    initializeCurrentIssuesList,
    getMissedIssuesList
} from "./redmine";
import {checkNotes, delayedNotifications, notifyNewIssue, notifyStatusUpdate} from "./notifications";
import {Config} from "./config";
import {sendMessage} from "./telegram";

const issuesListRequest = `${Config.BASE_URL}/issues.json?key=${Config.REDMINE_API_KEY}&status_id!=5`;
const helloMessage = "Бот запущен!";

async function main(): Promise<void> {
    const now = Date.now();

    if (await isWorkTime(now) && getMissedIssuesList().length > 0) {
        await delayedNotifications();
    }

    try {
        const response: AxiosResponse = await axios.get(issuesListRequest);
        const newIssuesList = response.data.issues;

        // Сравнение списков задач на наличие изменений
        const newIssuesMap: Map<number, Issue> = new Map(newIssuesList.map((issue: Issue) => [issue.id, issue]));
        for (const issue of getCurrentIssuesList()) {
            const currentIssue = newIssuesMap.get(issue.id);

            if (!currentIssue) {
                if (ignoreFilter(issue)) {
                    await processNewIssue(issue, now);
                }
            } else if (currentIssue.status.name !== issue.status.name || currentIssue.updated_on !== issue.updated_on) {
                await processIssueUpdate(issue, currentIssue, now);
            }
        }
        assignCurrentIssuesList(newIssuesList);
        // console.log(JSON.stringify(getCurrentIssuesList()));
        console.log(`Запрос обновлений ${getCurrentTime()}`)
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

async function processIssueUpdate(currentIssue: Issue, issue: Issue, now: number) {
    const oldStatus = (currentIssue.status as unknown as IssueContent).name;
    const appointed = (issue.assigned_to as unknown as IssueContent).name;

    if (await isWorkTime(now)) {
        await notifyStatusUpdate(issue, oldStatus, appointed);
        if (currentIssue.updated_on !== issue.updated_on) {
            checkNotes(currentIssue);
        }
    } else {
        if (!getMissedIssuesList().includes(issue)) {
            addIssueInOffTime(issue);
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

initializeCurrentIssuesList().then(async () => {
    setInterval(main, 60000);
    console.log(`Бот запущен ${getCurrentTime()}`);
    await sendMessage(helloMessage);
});
