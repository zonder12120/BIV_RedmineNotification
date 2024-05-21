export interface IssueContent {
    id: number;
    name: string;
    value: string | null;
}

export interface Journal {
    id: number;
    user: IssueContent;
    notes: string;
    created_on: string;
    details: Array<JournalDetail>;
}

export interface JournalDetail {
    property: string;
    name: string;
    old_value: string;
    new_value: string;
}

export interface Issue {
    id: number;
    project: IssueContent;
    tracker: IssueContent;
    status: IssueContent;
    priority: IssueContent;
    author: IssueContent;
    assigned_to: IssueContent | null;
    subject: string;
    description: string;
    start_date: string;
    due_date: string;
    done_ratio: number;
    is_private: boolean;
    estimated_hours: number | null;
    custom_fields: Array<IssueContent>;
    created_on: string;
    updated_on: string;
    closed_on: string | null;
    journals?: Journal[];
}

export interface Holiday {
    start: {
        date: string;
    };
}
