import React from 'react';
import { Plus, Edit2, Save, CheckCircle2, XCircle, RefreshCcw, Percent } from 'lucide-react';
import { useLanguage } from '../i18n';
import { Account, Category, Transaction } from '../types/accounting';
import { cn } from '../utils/cn';
import { useTransactionForm, TransactionFormData } from '../hooks/useTransactionForm';
import { TransactionRecurrenceFields } from './TransactionRecurrenceFields';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { transactionSchema } from '../utils/validation';
import { toast } from 'sonner';
import { VAT_RATE, BALANCE_TOLERANCE } from '../utils/constants';

// Import subcomponents
import { BalanceIndicator } from './TransactionForm/BalanceIndicator';
import { ImpactRow } from './TransactionForm/ImpactRow';
import { CustomAccountModal } from './TransactionForm/CustomAccountModal';

interface TransactionFormProps {
  initialTransaction?: Transaction | null;
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  isUploading: boolean;
  allAccounts: Account[];
  currency: string;
  addCustomAccount: (name: string, category: Category) => Promise<Account | null>;
  isModal?: boolean;
  onCloseModal?: () => void;
  modalScrollRef?: React.RefObject<HTMLDivElement>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialTransaction,
  onSubmit,
  onCancel,
  isUploading,
  allAccounts,
  currency,
  addCustomAccount,
  isModal = false,
  onCloseModal,
  modalScrollRef
}) => {
  const { t, language, dir } = useLanguage();
  const {
    date, setDate,
    description, setDescription,
    isRecurring, setIsRecurring,
    recurrenceInterval, setRecurrenceInterval,
    impacts, setImpacts, handleAddImpact, handleRemoveImpact, handleImpactChange,
    resetForm,
    getFormData
  } = useTransactionForm(initialTransaction);

  const { totalDebit, totalCredit, isBalanced, balanceDifference } = React.useMemo(() => {
    let debit = 0;
    let credit = 0;
    impacts.forEach(impact => {
      const amount = Math.abs(typeof impact.amount === 'number' ? impact.amount : 0);
      const account = allAccounts.find(a => a.id === impact.accountId);
      const isNeg = (typeof impact.amount === 'number' ? impact.amount : 0) < 0 || Object.is(impact.amount, -0);
      const isCredit = impact.type
        ? impact.type === 'credit'
        : (account
          ? (account.category === 'asset' ? isNeg : !isNeg)
          : isNeg);
      if (isCredit) credit += amount;
      else debit += amount;
    });
    const diff = Math.abs(debit - credit);
    return {
      totalDebit: debit,
      totalCredit: credit,
      balanceDifference: diff,
      isBalanced: diff < BALANCE_TOLERANCE
    };
  }, [impacts, allAccounts]);

  const handleClearImpacts = () => {
    setImpacts([
      { accountId: allAccounts.find(a => a.category === 'asset')?.id || '', amount: 0 },
      { accountId: allAccounts.find(a => a.category === 'equity')?.id || '', amount: 0 },
    ]);
  };

  const handleApplyVat = () => {
    const newImpacts = [...impacts];
    const baseIndex = newImpacts.findIndex(imp => imp.amount !== 0 && imp.accountId !== '');
    if (baseIndex === -1) {
      toast.error(language === 'ar' ? 'أدخل مبلغاً أولاً لحساب الضريبة' : 'Enter an amount first to calculate VAT');
      return;
    }
    const baseImpact = newImpacts[baseIndex];
    const baseAmount = Math.abs(baseImpact.amount);
    const vatAmount = parseFloat((baseAmount * VAT_RATE).toFixed(2));
    const account = allAccounts.find(a => a.id === baseImpact.accountId);
    
    let vatAccountId = 'vat_payable';
    let isVatDebit = false;
    const isBaseDebit = baseImpact.type 
      ? baseImpact.type === 'debit'
      : account ? (account.category === 'asset' ? baseImpact.amount > 0 : baseImpact.amount < 0) : true;
      
    if (isBaseDebit) {
      vatAccountId = 'vat_receivable';
      isVatDebit = true;
    } else {
      vatAccountId = 'vat_payable';
      isVatDebit = false;
    }

    newImpacts.push({
        accountId: vatAccountId,
        amount: vatAmount,
        type: isVatDebit ? 'debit' : 'credit'
    });

    const balancingIndex = newImpacts.findIndex((imp, idx) => idx !== baseIndex && imp.amount !== 0 && imp.accountId !== '');
    if (balancingIndex !== -1) {
       const balancingImpact = newImpacts[balancingIndex];
       const balancingIsDebit = balancingImpact.type 
         ? balancingImpact.type === 'debit'
         : (() => {
             const balAcc = allAccounts.find(a => a.id === balancingImpact.accountId);
             return balAcc ? (balAcc.category === 'asset' ? balancingImpact.amount > 0 : balancingImpact.amount < 0) : false;
           })();
           
       if (balancingIsDebit === !isVatDebit) {
         newImpacts[balancingIndex] = {
             ...balancingImpact,
             amount: balancingImpact.amount + (balancingImpact.amount > 0 ? vatAmount : -vatAmount)
         };
       }
    }
    setImpacts(newImpacts);
    toast.success(language === 'ar' ? 'تم تطبيق ضريبة القيمة المضافة 15%' : '15% VAT Applied');
  };

  const modalRef = useFocusTrap(isModal);
  const [customAccountModalIdx, setCustomAccountModalIdx] = React.useState<number | null>(null);
  const customAccountRef = useFocusTrap(customAccountModalIdx !== null);
  const [newCustomAccountName, setNewCustomAccountName] = React.useState('');
  const [newCustomAccountCategory, setNewCustomAccountCategory] = React.useState<Category>('asset');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseData = getFormData();
    
    const mappedImpacts = baseData.impacts.map(imp => {
      const account = allAccounts.find(a => a.id === imp.accountId);
      const isNeg = (typeof imp.amount === 'number' ? imp.amount : 0) < 0 || Object.is(imp.amount, -0);
      let type: 'debit' | 'credit' = 'debit';
      if ((imp as any).type) {
        type = (imp as any).type;
      } else if (account) {
        type = account.category === 'asset' ? (isNeg ? 'credit' : 'debit') : (isNeg ? 'debit' : 'credit');
      }
      return {
        accountId: imp.accountId,
        amount: Math.abs(typeof imp.amount === 'number' ? imp.amount : 0),
        type
      };
    }).filter(imp => imp.amount !== 0 && imp.accountId !== '');

    const data = {
      ...baseData,
      impacts: mappedImpacts
    };

    const parsed = transactionSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        if (issue.path.length > 0) fieldErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) {
        const firstErrorKey = Object.values(fieldErrors)[0];
        toast.error(t(firstErrorKey));
      }
    } else {
      setErrors({});
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onSubmit(parsed.data as TransactionFormData);
      }, 1000);
    }
  };

  const innerFormContent = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="col-span-1">
          <label htmlFor={isModal ? "mob-tx-date" : "dt-tx-date"} className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('date')}</label>
          <div className="relative">
            <input
              id={isModal ? "mob-tx-date" : "dt-tx-date"}
              name={isModal ? "mob-date" : "dt-date"}
              type="text"
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder={t('exampleDate')}
              className={cn(
                "w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none",
                isModal && "py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                errors['date'] && "border-rose-500 focus:border-rose-500"
              )}
            />
            {errors['date'] && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold absolute">{t(errors['date'])}</p>}
          </div>
        </div>
        <div className="col-span-2">
          <label htmlFor={isModal ? "mob-tx-description" : "dt-tx-desc"} className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('description')}</label>
          <div className="relative">
            <input
              id={isModal ? "mob-tx-description" : "dt-tx-desc"}
              name={isModal ? "mob-description" : "dt-description"}
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('exampleDesc')}
              className={cn(
                "w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none",
                isModal && "py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10",
                errors['description'] && "border-rose-500 focus:border-rose-500"
              )}
            />
            {errors['description'] && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold absolute">{t(errors['description'])}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("text-[11px] font-bold uppercase tracking-widest ml-1 text-theme-muted", isModal && "text-[10px] font-black text-slate-500")}>{t('impactOnAccounts')}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleApplyVat} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 transition-all bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500/50" title={language === 'ar' ? 'حساب ضريبة القيمة المضافة 15%' : 'Calculate 15% VAT'}>
                <Percent className="w-3 h-3" />
                <span className="hidden sm:inline">{language === 'ar' ? '+ ضريبة 15%' : '+ 15% VAT'}</span>
              </button>
              <button type="button" onClick={handleClearImpacts} className="text-[10px] font-bold text-slate-500 hover:text-rose-500 flex items-center gap-1.5 transition-all bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-rose-500/30" title={language === 'ar' ? 'تفريغ الحسابات' : 'Clear Accounts'}>
                <RefreshCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{language === 'ar' ? 'تفريغ' : 'Clear'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button type="button" onClick={handleAddImpact} className={cn("touch-target text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-2 transition-all bg-indigo-500/10 hover:bg-indigo-500 px-4 py-2.5 rounded-xl border border-indigo-500/20 uppercase tracking-tighter w-full sm:w-auto justify-center", isModal && "text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 tracking-widest font-black")}>
              <Plus className={cn("w-4 h-4", isModal && "w-3.5 h-3.5")} /> {t('addAccount')}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {impacts.map((impact, idx) => (
            <ImpactRow
              key={idx}
              impact={impact}
              idx={idx}
              allAccounts={allAccounts}
              handleImpactChange={handleImpactChange}
              handleRemoveImpact={handleRemoveImpact}
              setCustomAccountModalIdx={setCustomAccountModalIdx}
              t={t}
              language={language}
              error={errors[`impacts.${idx}.accountId`]}
              amountError={errors[`impacts.${idx}.amount`]}
            />
          ))}
        </div>
        
        {errors['impacts'] && (
          <div className="flex justify-start px-2 mt-2">
            <span className="text-rose-500 text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30">
              {t(errors['impacts'])}
              {errors['impacts'] === 'mustBeBalanced' && !isBalanced && (
                <span className="mx-2 font-mono" dir="ltr">({t('difference')} {balanceDifference})</span>
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={dir} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
        <div className="absolute inset-0" onClick={onCloseModal} />
        <form ref={modalRef as unknown as React.RefObject<HTMLFormElement>} onSubmit={handleSubmit} className={cn("relative w-full max-w-2xl bg-white dark:bg-slate-900 border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col transition-all rounded-t-[2.5rem] md:rounded-[2rem] h-fit max-h-[92vh] md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-500 md:zoom-in-95")}>
          <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b dark:border-white/10 border-slate-200 flex-none bg-white dark:bg-slate-900 z-10 gap-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between sm:justify-start w-full sm:w-auto">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h3 id="transaction-modal-title" className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl"><Plus className="w-5 h-5 text-indigo-400" /></div>
                  {initialTransaction ? t('editTransaction') : t('addNewTransaction')}
                </h3>
                <button type="button" onClick={onCloseModal} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all sm:hidden"><XCircle className="w-6 h-6" /></button>
              </div>
              <div className="w-full sm:w-auto flex items-center justify-start">
                <TransactionRecurrenceFields isRecurring={isRecurring} setIsRecurring={setIsRecurring} recurrenceInterval={recurrenceInterval} setRecurrenceInterval={setRecurrenceInterval} isModal={isModal} />
              </div>
            </div>
            <div className="flex items-end sm:items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
              <button type="button" onClick={onCloseModal} className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all flex-none self-center"><XCircle className="w-6 h-6" /></button>
            </div>
          </div>
          <div ref={modalScrollRef} className="p-6 overflow-y-auto custom-scrollbar no-scrollbar flex-1 max-h-[calc(92vh-180px)] md:max-h-[calc(85vh-180px)] space-y-6 pb-6 bg-slate-50/50 dark:bg-slate-950/20">
            {innerFormContent()}
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-white/10 border-slate-200 flex gap-4 flex-none z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
            {initialTransaction && (
              <button type="button" onClick={() => { resetForm(); onCancel(); }} className={cn("px-4 py-3 sm:py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 touch-target w-full sm:w-auto", isModal && "flex-1 shadow-sm")}>
                <XCircle className="w-5 h-5" />{t('cancel')}
              </button>
            )}
            <button type="submit" disabled={isUploading || isSaved} className={cn("flex-1 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2", isSaved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30")}>
              {isSaved ? (<><CheckCircle2 className="w-5 h-5 animate-scale-in" /><span className="animate-fade-in">{language === 'ar' ? 'تم الحفظ' : 'Saved'}</span></>) : isUploading ? (t('uploading')) : (initialTransaction ? t('saveChanges') : t('addTransaction'))}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border-t-4 border-indigo-500 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <h2 className="text-xl font-bold text-theme-primary flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              {initialTransaction ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
            </div>
            {initialTransaction ? t('editTransaction') : t('addNewTransaction')}
          </h2>
          <TransactionRecurrenceFields isRecurring={isRecurring} setIsRecurring={setIsRecurring} recurrenceInterval={recurrenceInterval} setRecurrenceInterval={setRecurrenceInterval} isModal={isModal} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {innerFormContent()}
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={isUploading || isSaved} className={cn("flex-1 text-white font-bold py-4 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95", isSaved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30")}>
            {isSaved ? (<><CheckCircle2 className="w-6 h-6 animate-scale-in" /><span className="uppercase tracking-widest animate-fade-in">{language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully'}</span></>) : isUploading ? (<><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> {t('uploading')}</>) : (<>{initialTransaction ? <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}<span className="uppercase tracking-widest">{initialTransaction ? t('saveChanges') : t('addTransaction')}</span></>)}
          </button>
          {initialTransaction && (
            <button type="button" onClick={() => { resetForm(); onCancel(); }} className="px-8 bg-slate-200 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 dark:text-white text-slate-700 font-bold py-4 rounded-2xl transition-all border border-slate-300 dark:border-white/10 uppercase tracking-widest text-xs">
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
      <CustomAccountModal
        customAccountModalIdx={customAccountModalIdx}
        setCustomAccountModalIdx={setCustomAccountModalIdx}
        customAccountRef={customAccountRef as any}
        dir={dir}
        language={language}
        t={t}
        newCustomAccountName={newCustomAccountName}
        setNewCustomAccountName={setNewCustomAccountName}
        newCustomAccountCategory={newCustomAccountCategory}
        setNewCustomAccountCategory={setNewCustomAccountCategory}
        addCustomAccount={addCustomAccount}
        handleImpactChange={handleImpactChange}
      />
    </div>
  );
};
