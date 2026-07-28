import { z } from 'zod';
import { BALANCE_TOLERANCE } from './constants';

export const impactSchema = z.object({
  accountId: z.string().min(1, 'errorOccurred'),
  amount: z.number().refine(val => val !== 0, 'enterValidAmount'),
  type: z.enum(['debit', 'credit'])
});

export const transactionSchema = z.object({
  description: z.string().trim().min(1, 'enterDescription'),
  date: z.string().min(1, 'errorOccurred'),
  impacts: z.array(impactSchema).min(1, 'enterValidAmount'),
  isRecurring: z.boolean().optional(),
  recurrenceInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
}).refine((data) => {
  const totalDebit = data.impacts.reduce((sum, i) => sum + (i.type === 'debit' ? i.amount : 0), 0);
  const totalCredit = data.impacts.reduce((sum, i) => sum + (i.type === 'credit' ? i.amount : 0), 0);

  // التحقق من أن القيد متزن مع استخدام سماحية لتلافي أخطاء التقريب العشري
  return Math.abs(totalDebit - totalCredit) < BALANCE_TOLERANCE && totalDebit > 0;
}, {
  message: "mustBeBalanced",
  path: ["impacts"]
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
