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
            if (!newIssuesMap.has(issue.id)) {
                if (ignoreFilter(issue)) {
                    if (await isWorkTime(now)) {
                        await notifyNewIssue(issue)
                    } else if (!getMissedIssuesList().includes(issue)) {
                        addIssueInOffTime(issue)
                    }
                }
            } else {
                const currentIssue = newIssuesMap.get(issue.id);

                if (currentIssue && currentIssue.status.name !== issue.status.name) {
                    if (await isWorkTime(now)) {
                        await notifyStatusUpdate(
                            issue,
                            (currentIssue.status as unknown as IssueContent).name,
                            (issue.assigned_to as unknown as IssueContent).name
                        )
                    } else if (!getMissedIssuesList().includes(issue)) {
                        addIssueInOffTime(issue)
                    }

                    if ((currentIssue.updated_on as string) !== issue.updated_on) {
                        if (await isWorkTime(now)) {
                            checkNotes(currentIssue)
                        } else if (!getMissedIssuesList().includes(issue)) {
                            addIssueInOffTime(issue)
                        }
                    }
                } else if (currentIssue && (currentIssue.updated_on as string) !== issue.updated_on) {
                    if (await isWorkTime(now)) {
                        checkNotes(currentIssue)
                    } else if (!getMissedIssuesList().includes(issue)) {
                        addIssueInOffTime(issue)
                    }
                }
            }
        }
        assignCurrentIssuesList(newIssuesList);
        // console.log(JSON.stringify(getCurrentIssuesList()));
        console.log(`Запрос обновлений ${getCurrentTime()}`)
    } catch (error) {
        console.error(`Ошибка при получении обновлений из Redmine: ${error} ${getCurrentTime()}`);
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


