import { describe, it, expect } from 'vitest';
import { calculateTotals } from './accounting';
import { Transaction, Account } from '../types/accounting';

describe('calculateTotals', () => {
  const assets: Account[] = [{ id: 'bank', name: 'Bank', category: 'asset' }];
  const liabilities: Account[] = [{ id: 'loan', name: 'Loan', category: 'liability' }];
  const equities: Account[] = [{ id: 'capital', name: 'Capital', category: 'equity' }];
  const activeAccountIds = ['bank', 'loan', 'capital'];

  it('should return zeros when there are no transactions', () => {
    const result = calculateTotals([], activeAccountIds, assets, liabilities, equities);
    
    expect(result.totalAssets).toBe(0);
    expect(result.totalLiabilities).toBe(0);
    expect(result.totalEquity).toBe(0);
    expect(result.isBalanced).toBe(true);
  });

  it('should balance a simple double-entry transaction', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-06-10',
        description: 'Capital investment',
        impacts: [
          { accountId: 'bank', amount: 1000 },
          { accountId: 'capital', amount: 1000 }
        ]
      }
    ];

    const result = calculateTotals(transactions, activeAccountIds, assets, liabilities, equities);
    
    expect(result.totalAssets).toBe(1000);
    expect(result.totalLiabilities).toBe(0);
    expect(result.totalEquity).toBe(1000);
    expect(result.isBalanced).toBe(true);
  });

  it('should handle transactions involving liabilities', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-06-10',
        description: 'Capital investment',
        impacts: [
          { accountId: 'bank', amount: 1000 },
          { accountId: 'capital', amount: 1000 }
        ]
      },
      {
        id: 'tx2',
        date: '2026-06-10',
        description: 'Bank loan taken',
        impacts: [
          { accountId: 'bank', amount: 500 },
          { accountId: 'loan', amount: 500 }
        ]
      }
    ];

    const result = calculateTotals(transactions, activeAccountIds, assets, liabilities, equities);
    
    expect(result.totalAssets).toBe(1500);
    expect(result.totalLiabilities).toBe(500);
    expect(result.totalEquity).toBe(1000);
    expect(result.isBalanced).toBe(true);
  });

  it('should return false for isBalanced if equation does not hold', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-06-10',
        description: 'One-sided entry (unbalanced)',
        impacts: [
          { accountId: 'bank', amount: 1000 }
        ]
      }
    ];

    const result = calculateTotals(transactions, activeAccountIds, assets, liabilities, equities);
    
    expect(result.totalAssets).toBe(1000);
    expect(result.totalLiabilities).toBe(0);
    expect(result.totalEquity).toBe(0);
    expect(result.isBalanced).toBe(false);
  });

  it('should calculate correctly using debit and credit types', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-06-10',
        description: 'Buy asset on credit',
        impacts: [
          { accountId: 'bank', amount: 500, type: 'debit' }, // Asset debit increases
          { accountId: 'loan', amount: 500, type: 'credit' } // Liability credit increases
        ]
      },
      {
        id: 'tx2',
        date: '2026-06-11',
        description: 'Pay part of loan',
        impacts: [
          { accountId: 'loan', amount: 200, type: 'debit' }, // Liability debit decreases
          { accountId: 'bank', amount: 200, type: 'credit' } // Asset credit decreases
        ]
      }
    ];

    const result = calculateTotals(transactions, activeAccountIds, assets, liabilities, equities);
    
    // Bank = 500 - 200 = 300
    // Loan = 500 - 200 = 300
    expect(result.totalAssets).toBe(300);
    expect(result.totalLiabilities).toBe(300);
    expect(result.totalEquity).toBe(0);
    expect(result.isBalanced).toBe(true);
    expect(result.accounts['bank']).toBe(300);
    expect(result.accounts['loan']).toBe(300);
  });
});
