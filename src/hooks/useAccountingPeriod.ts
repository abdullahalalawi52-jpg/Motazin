import { useState, useMemo } from 'react';
import { Transaction } from '../types/accounting';

export function useAccountingPeriod(transactions: Transaction[]) {
  const [accountingPeriod, setAccountingPeriod] = useState<'all' | 'current_month' | 'current_year'>('all');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const parseDateHelper = (d: string) => {
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

    return transactions.filter(tx => {
      if (accountingPeriod === 'all') return true;
      const txDate = parseDateHelper(tx.date);
      if (accountingPeriod === 'current_month') {
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      }
      if (accountingPeriod === 'current_year') {
        return txDate.getFullYear() === currentYear;
      }
      return true;
    });
  }, [transactions, accountingPeriod]);

  return {
    accountingPeriod,
    setAccountingPeriod,
    filteredTransactions,
  };
}
