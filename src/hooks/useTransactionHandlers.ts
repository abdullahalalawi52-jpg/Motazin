import { Transaction } from '../types/accounting';
import { transactionSchema } from '../utils/validation';
import { toast } from 'sonner';
import { transactionService } from '../services/transactionService';
import { firestoreService } from '../services/firestoreService';
import { User } from 'firebase/auth';
import { TransactionFormData } from './useTransactionForm';
import { HistoryAction } from './useHistory';
import { ConfirmModalConfig } from '../store/useAppStore';
interface UseTransactionHandlersProps {
  transactions: Transaction[];
  updateTransactions: (txs: Transaction[]) => void;
  applyAction: (action: HistoryAction) => void;
  selectedTransactions: Set<string>;
  setSelectedTransactions: (set: Set<string>) => void;
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  setIsTransactionFormOpen: (open: boolean) => void;
  setConfirmModalOpen: (open: boolean) => void;
  triggerConfirmation: (config: ConfirmModalConfig) => void;
  user: User | null;
  budgets: Record<string, number>;
  setIsEditingBudgets: (editing: boolean) => void;
  setCurrency: (currency: string) => void;
  setIsUploading: (uploading: boolean) => void;
  t: (key: string) => string;
  language: string;
}

export function useTransactionHandlers({
  transactions, updateTransactions, applyAction,
  selectedTransactions, setSelectedTransactions,
  editingTransactionId, setEditingTransactionId,
  setIsTransactionFormOpen, setConfirmModalOpen,
  triggerConfirmation, user, budgets, setIsEditingBudgets,
  setCurrency, setIsUploading, t, language
}: UseTransactionHandlersProps) {

  const handleAddTransaction = (data: TransactionFormData) => {
    const parsed = transactionSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'errorOccurred';
      return toast.error(t(errorMsg) || errorMsg);
    }
    
    if (editingTransactionId) {
      const originalTx = transactions.find(t => t.id === editingTransactionId);
      if (originalTx) {
        const payload = { ...parsed.data, isRecurring: parsed.data.isRecurring ?? false };
        const updatedTx = transactionService.updateTransaction(originalTx, payload);
        const updatedTransactions = transactions.map(tx => tx.id === editingTransactionId ? updatedTx : tx);
        updateTransactions(updatedTransactions);
      }
      setEditingTransactionId(null);
    } else {
      const payload = { ...parsed.data, isRecurring: parsed.data.isRecurring ?? false };
      const newTx = transactionService.createTransaction(payload);
      updateTransactions([...transactions, newTx]);
    }
  };

  const handleBulkAttach = async (file: File) => {
    if (selectedTransactions.size === 0) {
      toast.error(language === 'ar' ? 'الرجاء تحديد معاملة واحدة على الأقل' : 'Please select at least one transaction');
      return;
    }
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول لإرفاق المستندات' : 'Must be logged in to attach documents');
      return;
    }
    
    setIsUploading(true);
    try {
      const url = await transactionService.uploadAttachment(user.uid, file);
      const updated = transactions.map(tx => {
        if (selectedTransactions.has(tx.id)) {
          return { ...tx, attachmentUrl: url };
        }
        return tx;
      });
      
      updateTransactions(updated);
      toast.success(language === 'ar' ? 'تم إرفاق المستند بنجاح' : 'Document attached successfully');
    } catch (error) {
      console.error("Error attaching document:", error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إرفاق المستند' : 'Error attaching document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    setIsTransactionFormOpen(true);
    if (window.innerWidth > 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransactionId(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      applyAction({ type: 'DELETE', tx });
    }
    if (selectedTransactions.has(id)) {
      const newSelected = new Set(selectedTransactions);
      newSelected.delete(id);
      setSelectedTransactions(newSelected);
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return;
    triggerConfirmation({
      title: language === 'ar' ? 'حذف عمليات متعددة' : 'Delete Multiple Transactions',
      message: t('confirmDeleteMultiple'),
      confirmText: language === 'ar' ? 'حذف' : 'Delete',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onConfirm: () => {
        const deleted = transactions.filter(t => selectedTransactions.has(t.id));
        applyAction({ type: 'BATCH', added: [], deleted });
        setSelectedTransactions(new Set());
        setConfirmModalOpen(false);
      }
    });
  };

  const handleClearAll = () => {
    triggerConfirmation({
      title: language === 'ar' ? 'مسح كافة البيانات' : 'Clear All Data',
      message: t('confirmClearAll'),
      confirmText: language === 'ar' ? 'مسح الكل' : 'Clear All',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onConfirm: () => {
        applyAction({ type: 'CLEAR', txs: transactions });
        setSelectedTransactions(new Set());
        setConfirmModalOpen(false);
      }
    });
  };

  const handleSaveBudgets = async () => {
    setIsEditingBudgets(false);
    localStorage.setItem('motazin_budgets', JSON.stringify(budgets));

    if (!user) {
      toast.success(t('budgetSavedSuccess'));
      return;
    }
    try {
      await firestoreService.saveBudgets(user.uid, budgets);
      toast.success(t('budgetSavedSuccess'));
    } catch {
      toast.error(t('budgetSaveError'));
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('motazin_currency', newCurrency);

    if (!user) return;
    try {
      await firestoreService.saveCurrency(user.uid, newCurrency);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    handleAddTransaction,
    handleBulkAttach,
    handleEditTransaction,
    handleCancelEdit,
    handleDeleteTransaction,
    handleSelectTransaction,
    handleSelectAll,
    handleBulkDelete,
    handleClearAll,
    handleSaveBudgets,
    handleCurrencyChange
  };
}

