import axios, {AxiosResponse} from "axios";
import {Config} from "./config";
import {Issue} from "./types";
import {getCurrentTime} from "./time";

const ignored = [71060]; // Игнорим задачу 71060, т.к. обновления по ней нас не волнуют, она создана для ведения учёта остальных задач
const issuesListRequest = `${Config.BASE_URL}/issues.json?key=${Config.REDMINE_API_KEY}&status_id!=5`;

let missedIssuesList: Issue[] = [];
let currentIssuesList: Issue[] = [];

export function getMissedIssuesList() {
    return missedIssuesList;
}

export function getCurrentIssuesList() {
    return currentIssuesList;
}

export function addMissedIssue(issue: Issue) {
    missedIssuesList.push(issue);
}

export function clearMissedIssues(){
    missedIssuesList = [];
}

export function assignCurrentIssuesList(issueslist: Issue[]): void {
    currentIssuesList = issueslist;
}

// Отфильтровываем задачи, которые мы добавили в список
export const ignoreFilter = (issue: Issue) => !ignored.includes(issue.id as number);

// Инициализируем список всех задач
export async function initializeCurrentIssuesList(): Promise<void> {
    try {
        const response: AxiosResponse = await axios.get(issuesListRequest);
        currentIssuesList = response.data.issues;
    } catch (error) {
        console.error(`Ошибка при инициализации списка задач из Redmine: ${error} ${getCurrentTime()}`);
    }
}

// Получаем журналы задачи
export async function getIssueJournals(id: number): Promise<Issue | void> {
    const req = `${Config.BASE_URL}/issues/${id}.json?include=journals&key=${Config.REDMINE_API_KEY}`;
    try {
        const response: AxiosResponse = await axios.get(req);
        return response.data.issue;
    } catch (error) {
        console.error(`Ошибка при получении журналов: ${error} ${getCurrentTime()}`);
    }
}

// Получение данных по задаче
export async function getIssueData(id: number) {
    const req = `${Config.BASE_URL}/issues/${id}.json?key=${Config.REDMINE_API_KEY}`;
    try {
        const response: AxiosResponse = await axios.get(req);
        return response.data.issue;
    } catch (error) {
        console.error(`Ошибка при получении данных задачи ${error} ${getCurrentTime()}`);
    }
}
