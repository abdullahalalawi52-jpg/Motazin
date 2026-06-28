import { useMemo } from 'react';
import { Transaction, Account } from '../types/accounting';
import { calculateTotals } from '../utils/accounting';

export function useFinancialInsights(
  filteredTransactions: Transaction[],
  allAccounts: Account[],
  t: (key: string) => string
) {
  const activeAccountIds = useMemo(() => {
    const ids = new Set<string>();
    filteredTransactions.forEach(t => t.impacts.forEach(i => ids.add(i.accountId)));
    return Array.from(ids);
  }, [filteredTransactions]);

  const activeAccounts = useMemo(() => {
    return allAccounts.filter(a => activeAccountIds.includes(a.id));
  }, [activeAccountIds, allAccounts]);

  const assets = useMemo(() => activeAccounts.filter(a => a.category === 'asset'), [activeAccounts]);
  const liabilities = useMemo(() => activeAccounts.filter(a => a.category === 'liability'), [activeAccounts]);
  const equities = useMemo(() => activeAccounts.filter(a => a.category === 'equity'), [activeAccounts]);

  const totals = useMemo(() => {
    return calculateTotals(filteredTransactions, activeAccountIds, assets, liabilities, equities);
  }, [filteredTransactions, activeAccountIds, assets, liabilities, equities]);

  const assetChartData = useMemo(() => {
    return assets
      .map(a => ({ name: t(a.name), value: Math.max(0, totals.accounts[a.id] || 0) }))
      .filter(d => d.value > 0);
  }, [assets, totals.accounts, t]);

  const incomeExpenseData = useMemo(() => {
    return [
      { name: t('revenue'), amount: Math.abs(totals.accounts['revenue'] || 0) },
      { name: t('expenses'), amount: Math.abs(totals.accounts['expenses'] || 0) }
    ];
  }, [totals.accounts, t]);

  const currentAssetIds = ['bank', 'cash', 'ar', 'inventory', 'supplies', 'prepaid_expenses'];
  const currentLiabilityIds = ['ap', 'short_term_loans', 'accrued_expenses', 'unearned_revenues'];

  const insights = useMemo(() => {
    const totalCurrentAssets = currentAssetIds.reduce((sum, id) => sum + (totals.accounts[id] || 0), 0);
    const totalCurrentLiabilities = currentLiabilityIds.reduce((sum, id) => sum + (totals.accounts[id] || 0), 0);

    const currentRatio = totalCurrentLiabilities !== 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const debtToEquity = totals.totalEquity !== 0 ? totals.totalLiabilities / totals.totalEquity : 0;
    const netProfit = (totals.accounts['revenue'] || 0) - Math.abs(totals.accounts['expenses'] || 0);

    return {
      currentRatio,
      debtToEquity,
      netProfit,
    };
  }, [totals]);

  const profitTrendData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    const parseDate = (d: string) => {
      if (!d) return new Date();
      const parts = d.split(/[/\-.]/);
      if (parts.length < 2) return new Date();

      let day = 1;
      let month = 0;
      let year = new Date().getFullYear();

      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parts[2] ? parseInt(parts[2]) : 1;
      } else {
        day = parseInt(parts[0]) || 1;
        month = (parseInt(parts[1]) || 1) - 1;
        year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : new Date().getFullYear();
      }

      const parsedDate = new Date(year, month, day);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    };

    const sortedTxs = [...filteredTransactions].sort((a, b) => {
      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });

    sortedTxs.forEach(tx => {
      const parsed = parseDate(tx.date);
      const year = parsed.getFullYear();
      const month = parsed.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      const impact = tx.impacts.reduce((sum, imp) => {
        if (imp.accountId === 'revenue' || imp.accountId === 'expenses') {
          return sum + imp.amount;
        }
        return sum;
      }, 0);

      monthlyData[key] = (monthlyData[key] || 0) + impact;
    });

    return Object.entries(monthlyData).map(([key, value]) => ({
      name: key,
      profit: value
    })).slice(-12);
  }, [filteredTransactions]);

  return {
    totals,
    insights,
    assetChartData,
    incomeExpenseData,
    profitTrendData,
    assets,
    liabilities,
    equities,
    activeAccounts,
  };
}
