import { useEffect } from 'react';
import { toast } from 'sonner';

export function useAppEffects(
  isBalanced: boolean,
  hasInitialBalance: boolean,
  setHasInitialBalance: (val: boolean) => void,
  isFormDirty: boolean,
  budgets: Record<string, number>,
  accounts: Record<string, number>,
  language: string
) {
  // Balance initialization effect
  useEffect(() => {
    if (isBalanced) {
      if (!hasInitialBalance) {
        setHasInitialBalance(true);
      }
    }
  }, [isBalanced, hasInitialBalance, setHasInitialBalance]);

  // Unsaved changes effect
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  // Budget alerts effect
  useEffect(() => {
    const checkBudgets = () => {
      Object.entries(budgets).forEach(([accountId, budgetLimit]) => {
        const currentAmount = accounts[accountId] || 0;
        if (currentAmount > budgetLimit) {
          toast.error(
            language === 'ar' 
              ? `تجاوز الميزانية: الحساب ${accountId} تجاوز الميزانية المحددة (${budgetLimit})`
              : `Budget Exceeded: Account ${accountId} has exceeded its budget (${budgetLimit})`
          );
        } else if (currentAmount > budgetLimit * 0.9) {
          toast.warning(
            language === 'ar'
              ? `تنبيه الميزانية: الحساب ${accountId} اقترب من الميزانية المحددة (${budgetLimit})`
              : `Budget Warning: Account ${accountId} is nearing its budget (${budgetLimit})`
          );
        }
      });
    };
    checkBudgets();
  }, [budgets, accounts, language]);
}
