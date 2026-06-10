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

export function calculateTotals(
  transactions: Transaction[],
  activeAccountIds: string[] | Set<string>,
  assets: Account[],
  liabilities: Account[],
  equities: Account[]
) {
  const accTotals: Record<string, number> = {};
  activeAccountIds.forEach(id => {
    accTotals[id] = 0;
  });

  transactions.forEach(t => {
    t.impacts.forEach(i => {
      if (accTotals[i.accountId] !== undefined) {
        accTotals[i.accountId] += i.amount;
      }
    });
  });

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  assets.forEach(a => {
    totalAssets += accTotals[a.id] || 0;
  });
  liabilities.forEach(a => {
    totalLiabilities += accTotals[a.id] || 0;
  });
  equities.forEach(a => {
    totalEquity += accTotals[a.id] || 0;
  });

  // Solve JS float precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
  const round = (num: number) => Math.round(num * 100) / 100;

  return {
    accounts: accTotals,
    totalAssets: round(totalAssets),
    totalLiabilities: round(totalLiabilities),
    totalEquity: round(totalEquity),
    isBalanced: round(totalAssets) === round(totalLiabilities + totalEquity)
  };
}
