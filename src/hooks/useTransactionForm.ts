import { useState, useEffect } from 'react';
import { Impact, Transaction } from '../types/accounting';


export interface TransactionFormData {
  date: string;
  description: string;
  impacts: Omit<Impact, 'id'>[];
  isRecurring: boolean;
  recurrenceInterval: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export function useTransactionForm(initialTransaction?: Transaction | null) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [impacts, setImpacts] = useState<Omit<Impact, 'id'>[]>([
    { accountId: 'bank', amount: 0 },
    { accountId: 'capital', amount: 0 },
  ]);

  const resetForm = () => {
    setDate('');
    setDescription('');
    setIsRecurring(false);
    setRecurrenceInterval('monthly');
    setImpacts([
      { accountId: 'bank', amount: 0 },
      { accountId: 'capital', amount: 0 },
    ]);
  };

  useEffect(() => {
    if (initialTransaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description);
      setImpacts(initialTransaction.impacts.map(i => ({ accountId: i.accountId, amount: i.amount })));
      setIsRecurring(initialTransaction.isRecurring || false);
      setRecurrenceInterval(initialTransaction.recurrenceInterval || 'monthly');
    } else {
      resetForm();
    }
  }, [initialTransaction]);

  const handleAddImpact = () => {
    setImpacts(prev => [...prev, { accountId: 'cash', amount: 0 }]);
  };

  const handleRemoveImpact = (index: number) => {
    setImpacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleImpactChange = (index: number, field: keyof Omit<Impact, 'id'>, value: string | number) => {
    setImpacts(prev => {
      const newImpacts = [...prev];
      newImpacts[index] = { ...newImpacts[index], [field]: value };
      return newImpacts;
    });
  };



  const getFormData = (): TransactionFormData => ({
    date,
    description,
    impacts,
    isRecurring,
    recurrenceInterval,
  });

  return {
    date, setDate,
    description, setDescription,
    isRecurring, setIsRecurring,
    recurrenceInterval, setRecurrenceInterval,
    impacts, setImpacts, handleAddImpact, handleRemoveImpact, handleImpactChange,
    resetForm,
    getFormData
  };
}
