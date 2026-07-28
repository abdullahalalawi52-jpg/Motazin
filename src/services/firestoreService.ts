import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const firestoreService = {
  saveBudgets: async (userId: string, budgets: Record<string, number>) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        budgets,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving budgets:", error);
      throw error;
    }
  },

  saveCurrency: async (userId: string, currency: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        currency,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving currency:", error);
      throw error;
    }
  }
};
