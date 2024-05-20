import {clearMissedIssues, getIssueData, getIssueJournals, getMissedIssuesList} from "./redmine";
import {sendMessage} from "./telegram";
import {Config} from "./config";
import {Issue, IssueContent} from "./types";

// Если были обновления по задачам в не рабочее время, при этом задачи являются активными, мы их выводим
export async function delayedNotifications() {
    const actualList: number[] = [];

    for (const issue of getMissedIssuesList()) {
        const index = getMissedIssuesList().indexOf(issue);
        let listingIssuesMsg = "";
        const res = await getIssueData(issue.id);
        if (res.status.id !== 3 && res.status.id !== 5 && !actualList.includes(res.id)) {
            actualList.push(res.id);
        }

        if (index === getMissedIssuesList().length - 1) {
            if (actualList.length === 1) {
                listingIssuesMsg = `задаче: ${actualList[0]}`;
            } else {
                listingIssuesMsg = `задачах: ${actualList.join(", ")}`;
            }

            if (actualList.length > 0) {
                await sendMessage(`Во вне рабочее время были изменения в ${listingIssuesMsg}`);
                console.log(`Во вне рабочее время были изменения в ${listingIssuesMsg}`);
            }
            clearMissedIssues();
        }
    }
}

// Уведомление о новой задаче
export async function notifyNewIssue(issue: Issue) {
    const message: string = `${checkTracker(issue.tracker as IssueContent)}Добавлена задача #${issue.id}${
        issue.assigned_to && issue.assigned_to.name ? " для " + (issue.assigned_to as IssueContent).name + " " : ""
    } - ${issue.subject}\n${Config.BASE_URL}/issues/${issue.id}`;
    const status = (issue.priority as IssueContent).id;

    const statusIcons: Record<number, string> = {
        2: "\u{1F7E2}", // 🟢 - 3 приоритет
        3: "\u{1F7E1}", // 🟡 - 2 приоритет
        4: "\u{1F534}", // 🔴 - 1 приоритет
        5: "\u{2B24}", //  ⬤ - 0 приоритет (в тёмной теме может отображаться как белый)
    };
    const icon = statusIcons[status] || "";

    await sendMessage(icon + message, {
        parse_mode: "HTML",
    });
    console.log(message);
}

// Проверяем трекер, если платка, отмечаем символом 💰
const checkTracker = (tracker: IssueContent) => (tracker.id === 4 ? "\u{1F4B0}" : "");

// Оповещение об изменении статуса задачи
export async function notifyStatusUpdate(issue: Issue, oldStatus: string, appointed: string) {
    const message: string = `${issue.status.id === 2 ? "<u>" : ""}${checkTracker(issue.tracker as IssueContent)}В задаче #${
        issue.id
    }${appointed ? " (" + appointed + ") " : ""} изменён статус с: "${oldStatus}" на "${issue.status.name}"${
        issue.status.id === 2 ? "</u>" : ""
    }\n${Config.BASE_URL}/issues/${issue.id}`;
    await sendMessage(message, {
        parse_mode: "HTML",
    });
    console.log(message);
}

// Оповещение об изменениях в задаче
export async function notifyIssueUpdate(issue: Issue) {
    const message: string = `${checkTracker(issue.tracker as IssueContent)}Обновление в задаче #${issue.id}${
        issue.assigned_to && issue.assigned_to.name ? " (" + issue.assigned_to.name + ") " : ""
    }\n${Config.BASE_URL}/issues/${issue.id}`;
    await sendMessage(message);
    console.log(message);
}

// Присылаем уведомление, если был добавлен коммент
export function checkNotes(issue: Issue) {
    getIssueJournals(issue.id).then(async (res: void | Issue) => {
        if (res) {
            const issueWithJournals = res;

            if (issueWithJournals.journals && issueWithJournals.journals.length > 0) {
                const lastComment = issueWithJournals.journals.sort((a, b) => (a.id) - (b.id as number)).pop();
                if (lastComment && lastComment.notes && lastComment.notes.length > 0) {
                    const message: string = `${checkTracker(issue.tracker as IssueContent)}В задаче #${issue.id}${
                        issue.assigned_to && issue.assigned_to.name ? " (" + (issue.assigned_to as IssueContent).name + ") " : ""
                    } добавлен комментарий: ${lastComment.notes}\n${Config.BASE_URL}/issues/${issue.id}`;
                    await sendMessage(message);
                    console.log(message);
                }
            } else {
                await notifyIssueUpdate(issue);
            }
        }
    });
}