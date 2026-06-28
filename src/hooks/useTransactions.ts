import { useState, useMemo } from 'react';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Transaction, Account, Category } from '../types/accounting';
import { ACCOUNTS } from '../constants/accounting';
import { generateId } from '../utils/uuid';

export function useTransactions(user: User | null, t: (key: string) => string) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('motazin_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local transactions', e);
      }
    }
    return [];
  });

  const [customAccounts, setCustomAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('motazin_custom_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const allAccounts = useMemo(() => {
    return [...ACCOUNTS, ...customAccounts];
  }, [customAccounts]);

  const saveTransactions = async (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);

    if (!user) {
      localStorage.setItem('motazin_transactions', JSON.stringify(newTransactions));
    } else {
      localStorage.removeItem('motazin_transactions');
    }

    if (!user) return;

    try {
      const txRef = collection(db, 'users', user.uid, 'transactions');
      const oldMap = new Map(transactions.map(tx => [tx.id, tx]));
      const newMap = new Map(newTransactions.map(tx => [tx.id, tx]));

      const deletes = transactions
        .filter(tx => !newMap.has(tx.id))
        .map(tx => ({
          type: 'delete' as const,
          ref: doc(txRef, tx.id)
        }));

      const isTxEqual = (a: Transaction, b: Transaction) => {
        if (a.date !== b.date) return false;
        if (a.description !== b.description) return false;
        if (a.isRecurring !== b.isRecurring) return false;
        if (a.recurrenceInterval !== b.recurrenceInterval) return false;
        if (a.nextRecurrenceDate !== b.nextRecurrenceDate) return false;
        if (a.attachmentUrl !== b.attachmentUrl) return false;
        if (a.impacts.length !== b.impacts.length) return false;
        for (let i = 0; i < a.impacts.length; i++) {
          if (a.impacts[i].accountId !== b.impacts[i].accountId) return false;
          if (a.impacts[i].amount !== b.impacts[i].amount) return false;
        }
        return true;
      };

      const sets = newTransactions
        .filter(tx => {
          const oldTx = oldMap.get(tx.id);
          return !oldTx || !isTxEqual(oldTx, tx);
        })
        .map(tx => ({
          type: 'set' as const,
          ref: doc(txRef, tx.id),
          data: {
            date: tx.date,
            description: tx.description,
            impacts: tx.impacts,
            attachmentUrl: tx.attachmentUrl || null,
            createdAt: tx.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isRecurring: tx.isRecurring || false,
            recurrenceInterval: tx.recurrenceInterval || null,
            nextRecurrenceDate: tx.nextRecurrenceDate || null
          }
        }));

      const allOps = [...deletes, ...sets];
      if (allOps.length === 0) return;

      const CHUNK_SIZE = 500;
      for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
        const currentBatch = writeBatch(db);
        const chunk = allOps.slice(i, i + CHUNK_SIZE);
        chunk.forEach(op => {
          if (op.type === 'delete') {
            currentBatch.delete(op.ref);
          } else if (op.type === 'set' && op.data) {
            currentBatch.set(op.ref, op.data, { merge: true });
          }
        });
        await currentBatch.commit();
      }
    } catch (error) {
      console.error('Error updating transactions:', error);
      toast.error(t('errorSavingTransactions'));
    }
  };

  const addCustomAccount = async (name: string, category: Category) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const nameExists = allAccounts.some(
      a => a.name.toLowerCase() === trimmedName.toLowerCase() ||
        t(a.name).toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      toast.error(t('accountExists'));
      return null;
    }

    const newId = 'custom_' + generateId();
    const newAccount: Account = {
      id: newId,
      name: trimmedName,
      category: category
    };

    const updated = [...customAccounts, newAccount];
    setCustomAccounts(updated);
    localStorage.setItem('motazin_custom_accounts', JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          customAccounts: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving custom accounts to Firebase:', error);
      }
    }

    toast.success(t('accountAdded'));
    return newAccount;
  };

  return {
    transactions,
    setTransactions,
    customAccounts,
    setCustomAccounts,
    allAccounts,
    saveTransactions,
    addCustomAccount,
  };
}
