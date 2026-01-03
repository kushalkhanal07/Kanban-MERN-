export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: ColumnId;
  createdAt: number;
}

export type ColumnId = 'todo' | 'in-progress' | 'done';

export interface Column {
  id: ColumnId;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];
