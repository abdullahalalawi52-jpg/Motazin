import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFinancialInsights } from './useFinancialInsights';
import { Transaction, Account } from '../types/accounting';

describe('useFinancialInsights', () => {
  const t = vi.fn((key) => key);

  const mockAccounts: Account[] = [
    { id: 'bank', name: 'Bank', category: 'asset' },
    { id: 'ap', name: 'Accounts Payable', category: 'liability' },
    { id: 'capital', name: 'Capital', category: 'equity' },
    { id: 'revenue', name: 'Revenue', category: 'income' },
    { id: 'expenses', name: 'Expenses', category: 'expense' }
  ];

  it('should calculate initial values correctly', () => {
    const { result } = renderHook(() => useFinancialInsights([], mockAccounts, t));
    
    expect(result.current.totals.totalAssets).toBe(0);
    expect(result.current.totals.totalLiabilities).toBe(0);
    expect(result.current.totals.totalEquity).toBe(0);
    expect(result.current.insights.currentRatio).toBe(0);
    expect(result.current.insights.debtToEquity).toBe(0);
    expect(result.current.insights.netProfit).toBe(0);
  });

  it('should calculate insights and net profit based on transactions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-01-01',
        description: 'Capital',
        impacts: [
          { accountId: 'bank', amount: 10000, type: 'debit' },
          { accountId: 'capital', amount: 10000, type: 'credit' }
        ]
      },
      {
        id: '2',
        date: '2026-01-02',
        description: 'Sales',
        impacts: [
          { accountId: 'bank', amount: 5000, type: 'debit' },
          { accountId: 'revenue', amount: 5000, type: 'credit' }
        ]
      },
      {
        id: '3',
        date: '2026-01-03',
        description: 'Expenses',
        impacts: [
          { accountId: 'expenses', amount: 2000, type: 'debit' },
          { accountId: 'bank', amount: 2000, type: 'credit' }
        ]
      }
    ];

    const { result } = renderHook(() => useFinancialInsights(transactions, mockAccounts, t));

    // Revenue 5000, Expenses 2000 => Net Profit 3000
    expect(result.current.insights.netProfit).toBe(3000);

    // Bank = 10000 + 5000 - 2000 = 13000
    expect(result.current.totals.totalAssets).toBe(13000);
    
    // Equity = Capital (10000) + Net Profit (3000) = 13000
    expect(result.current.totals.totalEquity).toBe(13000);
  });
});
