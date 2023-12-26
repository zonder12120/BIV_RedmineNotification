export interface IssueContent {
    id: number;
    name: string;
    value: string|null;
    }
    
export interface Journal {
    [key: string]: IssueContent[]|number|string|boolean|typeof Date|null;
}
    
export interface Issue {
    [key: string]: Journal[]|IssueContent[]|number|string|boolean|typeof Date|null;
}