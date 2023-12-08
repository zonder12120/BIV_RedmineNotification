export interface IssueContent {
    id: number;
    name: string;
    value: string|null;
    }
    
export interface Issue {
    [key: string]: IssueContent[]|number|string|boolean|typeof Date|null;
}