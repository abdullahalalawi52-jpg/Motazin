import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Transaction, Impact } from '../types/accounting';
import { generateId } from '../utils/uuid';
import { toIsoDateString } from '../utils/date';

export const transactionService = {
  createTransaction: (data: {
    description: string;
    date: string;
    impacts: Omit<Impact, 'id'>[];
    isRecurring: boolean;
    recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }): Transaction => {
    const validImpacts = data.impacts.filter(i => i.amount !== 0);
    const nextDate = data.isRecurring && data.recurrenceInterval ? (() => {
      const d = new Date();
      if (data.recurrenceInterval === 'daily') d.setDate(d.getDate() + 1);
      if (data.recurrenceInterval === 'weekly') d.setDate(d.getDate() + 7);
      if (data.recurrenceInterval === 'monthly') d.setMonth(d.getMonth() + 1);
      if (data.recurrenceInterval === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    })() : undefined;

    return {
      id: generateId(),
      date: data.date || toIsoDateString(new Date()),
      description: data.description,
      impacts: validImpacts.map(i => ({ ...i, id: generateId() })),
      createdAt: new Date().toISOString(),
      isRecurring: data.isRecurring,
      recurrenceInterval: data.isRecurring ? data.recurrenceInterval : undefined,
      nextRecurrenceDate: data.isRecurring ? nextDate : undefined,
    };
  },

  updateTransaction: (
    originalTx: Transaction,
    data: {
      description: string;
      date: string;
      impacts: Omit<Impact, 'id'>[];
      isRecurring: boolean;
      recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    }
  ): Transaction => {
    const validImpacts = data.impacts.filter(i => i.amount !== 0);
    
    const nextDate = data.isRecurring && data.recurrenceInterval ? (() => {
      const d = new Date();
      if (data.recurrenceInterval === 'daily') d.setDate(d.getDate() + 1);
      if (data.recurrenceInterval === 'weekly') d.setDate(d.getDate() + 7);
      if (data.recurrenceInterval === 'monthly') d.setMonth(d.getMonth() + 1);
      if (data.recurrenceInterval === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    })() : undefined;

    return {
      ...originalTx,
      date: data.date || toIsoDateString(new Date()),
      description: data.description,
      impacts: validImpacts.map(i => ({ ...i, id: generateId() })),
      isRecurring: data.isRecurring,
      recurrenceInterval: data.isRecurring ? data.recurrenceInterval : undefined,
      nextRecurrenceDate: data.isRecurring ? (originalTx.nextRecurrenceDate || nextDate) : undefined,
      attachmentUrl: originalTx.attachmentUrl
    };
  },

  uploadAttachment: async (userId: string, file: File): Promise<string> => {
    const folderId = `bulk_${Date.now()}`;
    const fileRef = ref(storage, `users/${userId}/documents/${folderId}/${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  }
};
