import { useState } from 'react';
import { Transaction } from '../types/accounting';

export type HistoryAction =
  | { type: 'ADD'; tx: Transaction }
  | { type: 'DELETE'; tx: Transaction }
  | { type: 'EDIT'; oldTx: Transaction; newTx: Transaction }
  | { type: 'CLEAR'; txs: Transaction[] }
  | { type: 'BATCH'; added: Transaction[]; deleted: Transaction[] };

export function useHistory(
  transactions: Transaction[],
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
  saveTransactions: (txs: Transaction[]) => Promise<void>
) {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const applyAction = (action: HistoryAction) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(action);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    let newTransactions = [...transactions];
    if (action.type === 'ADD') {
      newTransactions.push(action.tx);
    } else if (action.type === 'DELETE') {
      newTransactions = newTransactions.filter(t => t.id !== action.tx.id);
    } else if (action.type === 'EDIT') {
      newTransactions = newTransactions.map(t => t.id === action.newTx.id ? action.newTx : t);
    } else if (action.type === 'CLEAR') {
      newTransactions = [];
    } else if (action.type === 'BATCH') {
      const deletedIds = new Set(action.deleted.map(t => t.id));
      newTransactions = newTransactions.filter(t => !deletedIds.has(t.id));
      newTransactions.push(...action.added);
    }

    saveTransactions(newTransactions);
  };

  const handleUndo = () => {
    if (historyIndex < 0) return;
    const action = history[historyIndex];
    let newTransactions = [...transactions];

    if (action.type === 'ADD') {
      newTransactions = newTransactions.filter(t => t.id !== action.tx.id);
    } else if (action.type === 'DELETE') {
      newTransactions.push(action.tx);
    } else if (action.type === 'EDIT') {
      newTransactions = newTransactions.map(t => t.id === action.oldTx.id ? action.oldTx : t);
    } else if (action.type === 'CLEAR') {
      newTransactions = action.txs;
    } else if (action.type === 'BATCH') {
      const addedIds = new Set(action.added.map(t => t.id));
      newTransactions = newTransactions.filter(t => !addedIds.has(t.id));
      newTransactions.push(...action.deleted);
    }

    setHistoryIndex(historyIndex - 1);
    saveTransactions(newTransactions);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const action = history[nextIndex];
    let newTransactions = [...transactions];

    if (action.type === 'ADD') {
      newTransactions.push(action.tx);
    } else if (action.type === 'DELETE') {
      newTransactions = newTransactions.filter(t => t.id !== action.tx.id);
    } else if (action.type === 'EDIT') {
      newTransactions = newTransactions.map(t => t.id === action.newTx.id ? action.newTx : t);
    } else if (action.type === 'CLEAR') {
      newTransactions = [];
    } else if (action.type === 'BATCH') {
      const deletedIds = new Set(action.deleted.map(t => t.id));
      newTransactions = newTransactions.filter(t => !deletedIds.has(t.id));
      newTransactions.push(...action.added);
    }

    setHistoryIndex(nextIndex);
    saveTransactions(newTransactions);
  };

  return {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    applyAction,
    handleUndo,
    handleRedo,
  };
}
