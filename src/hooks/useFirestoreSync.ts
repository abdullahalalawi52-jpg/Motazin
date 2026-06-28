import { useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Transaction, Account } from '../types/accounting';

export function useFirestoreSync(
  user: User | null,
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  setBudgets: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  setCurrency: React.Dispatch<React.SetStateAction<string>>,
  setCustomAccounts: React.Dispatch<React.SetStateAction<Account[]>>
) {
  // Sync User Preferences
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.budgets) setBudgets(data.budgets);
        if (data.currency) setCurrency(data.currency);
        if (data.customAccounts) setCustomAccounts(data.customAccounts);
      } else {
        setDoc(userDocRef, {
          currency: 'OMR',
          budgets: { cars: 20000, furniture: 12000, expenses: 5000 },
          customAccounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch(error => {
          console.error('Error initializing user preferences:', error);
        });
      }
    }, (error) => {
      console.error('Error fetching user preferences:', error);
    });

    return unsubscribe;
  }, [user, setBudgets, setCurrency, setCustomAccounts]);

  // Sync Transactions
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({
          id: doc.id,
          date: data.date,
          description: data.description,
          impacts: data.impacts,
          createdAt: data.createdAt,
          isRecurring: data.isRecurring,
          recurrenceInterval: data.recurrenceInterval,
          nextRecurrenceDate: data.nextRecurrenceDate,
          attachmentUrl: data.attachmentUrl
        });
      });
      setTransactions(txs);
    }, (error) => {
      console.error('Error fetching transactions:', error);
    });

    return unsubscribe;
  }, [user, setTransactions]);
}
