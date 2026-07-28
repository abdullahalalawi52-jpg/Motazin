import { describe, it, expect } from 'vitest';
import { transactionSchema, impactSchema } from './validation';

describe('Validation Schemas', () => {
  describe('impactSchema', () => {
    it('should validate a correct impact', () => {
      const result = impactSchema.safeParse({
        accountId: 'bank',
        amount: 100,
        type: 'debit'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if amount is 0', () => {
      const result = impactSchema.safeParse({
        accountId: 'bank',
        amount: 0,
        type: 'debit'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('enterValidAmount');
      }
    });

    it('should fail if type is invalid', () => {
      const result = impactSchema.safeParse({
        accountId: 'bank',
        amount: 100,
        type: 'invalid'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('transactionSchema', () => {
    it('should validate a balanced transaction', () => {
      const result = transactionSchema.safeParse({
        description: 'Test transaction',
        date: '2026-06-10',
        impacts: [
          { accountId: 'bank', amount: 100, type: 'debit' },
          { accountId: 'revenue', amount: 100, type: 'credit' }
        ]
      });
      expect(result.success).toBe(true);
    });

    it('should fail if transaction is unbalanced', () => {
      const result = transactionSchema.safeParse({
        description: 'Test transaction',
        date: '2026-06-10',
        impacts: [
          { accountId: 'bank', amount: 100, type: 'debit' },
          { accountId: 'revenue', amount: 50, type: 'credit' }
        ]
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('mustBeBalanced');
      }
    });

    it('should fail if description is empty', () => {
      const result = transactionSchema.safeParse({
        description: '   ',
        date: '2026-06-10',
        impacts: [
          { accountId: 'bank', amount: 100, type: 'debit' },
          { accountId: 'revenue', amount: 100, type: 'credit' }
        ]
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('enterDescription');
      }
    });
  });
});
