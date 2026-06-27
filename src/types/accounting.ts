export type Category = 'asset' | 'liability' | 'equity';

export interface Account {
  id: string;
  name: string;
  category: Category;
}

export interface Impact {
  id?: string;
  accountId: string;
  amount: number;
  type?: 'debit' | 'credit';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  impacts: Impact[];
  createdAt?: string;
  updatedAt?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRecurrenceDate?: string;
  attachmentUrl?: string;
}

export interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  selected: boolean;
}
