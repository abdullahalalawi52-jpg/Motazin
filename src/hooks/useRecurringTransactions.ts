import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { User } from 'firebase/auth';
import { Transaction } from '../types/accounting';
import { generateId } from '../utils/uuid';

export function useRecurringTransactions(
  user: User | null,
  transactions: Transaction[],
  updateTransactions: (newTxs: Transaction[], skipHistory?: boolean) => Promise<void>,
  t: (key: string) => string
) {
  const processedRecurrencesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user || transactions.length === 0) return;

    let hasChanges = false;
    const newTransactions: Transaction[] = [];

    const updatedTransactions = transactions.map(tx => {
      if (tx.isRecurring && tx.nextRecurrenceDate) {
        if (processedRecurrencesRef.current[tx.id] === tx.nextRecurrenceDate) {
          return tx;
        }

        let currentDate = new Date(tx.nextRecurrenceDate);
        const now = new Date();

        if (currentDate <= now) {
          processedRecurrencesRef.current[tx.id] = tx.nextRecurrenceDate;
          let currentTx = { ...tx };
          let safetyLimit = 0;

          while (currentDate <= now && safetyLimit < 100) {
            safetyLimit++;
            hasChanges = true;

            const newTx: Transaction = {
              id: generateId(),
              date: currentDate.toLocaleDateString('ar-SA'),
              description: currentTx.description,
              impacts: currentTx.impacts.map(i => ({ ...i, id: generateId() })),
              createdAt: new Date().toISOString()
            };
            newTransactions.push(newTx);

            const prevTime = currentDate.getTime();
            if (currentTx.recurrenceInterval === 'daily') currentDate.setDate(currentDate.getDate() + 1);
            else if (currentTx.recurrenceInterval === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            else if (currentTx.recurrenceInterval === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentTx.recurrenceInterval === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
            else break;

            if (currentDate.getTime() === prevTime) break;

            currentTx.nextRecurrenceDate = currentDate.toISOString();
          }
          return currentTx;
        }
      }
      return tx;
    });

    if (hasChanges) {
      updateTransactions([...updatedTransactions, ...newTransactions], true);
      toast.success(`${newTransactions.length} ${t('recurringCreated')}`);
    }
  }, [transactions, user, updateTransactions, t]);
}
