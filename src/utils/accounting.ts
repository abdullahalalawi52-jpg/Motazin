import { Category, Account, Impact, Transaction } from '../types/accounting';

/**
 * Calculates the running financial totals and balances for assets, liabilities, and equity
 * based on double-entry accounting transactions.
 * Resolves floating-point precision issues to ensure exact dollar-amount balances.
 * 
 * @param transactions - List of financial transactions containing account impacts
 * @param activeAccountIds - Array or Set of account IDs that have active transaction data
 * @param assets - Array of defined Asset accounts
 * @param liabilities - Array of defined Liability accounts
 * @param equities - Array of defined Equity accounts
 * @returns An object containing the aggregated account balances, totals, and the balanced status of the equation
 */
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
        if (i.type) {
          const isAsset = assets.some(a => a.id === i.accountId);
          const isCredit = i.type === 'credit';
          let finalAmount = i.amount;
          if (isAsset) {
            finalAmount = isCredit ? -i.amount : i.amount;
          } else {
            finalAmount = isCredit ? i.amount : -i.amount;
          }
          accTotals[i.accountId] += finalAmount;
        } else {
          accTotals[i.accountId] += i.amount;
        }
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
