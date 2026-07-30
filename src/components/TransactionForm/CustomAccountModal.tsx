import React from 'react';
import { cn } from '../../utils/cn';
import { Account, Category } from '../../types/accounting';

interface CustomAccountModalProps {
  customAccountModalIdx: number | null;
  setCustomAccountModalIdx: (idx: number | null) => void;
  customAccountRef: React.RefObject<HTMLDivElement>;
  dir: 'rtl' | 'ltr';
  language: string;
  t: (key: string) => string;
  newCustomAccountName: string;
  setNewCustomAccountName: (name: string) => void;
  newCustomAccountCategory: Category;
  setNewCustomAccountCategory: (category: Category) => void;
  addCustomAccount: (name: string, category: Category) => Promise<Account | null>;
  handleImpactChange: (index: number, field: string, value: string | number) => void;
}

export const CustomAccountModal: React.FC<CustomAccountModalProps> = ({
  customAccountModalIdx,
  setCustomAccountModalIdx,
  customAccountRef,
  dir,
  language,
  t,
  newCustomAccountName,
  setNewCustomAccountName,
  newCustomAccountCategory,
  setNewCustomAccountCategory,
  addCustomAccount,
  handleImpactChange
}) => {
  if (customAccountModalIdx === null) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="custom-account-title">
      <div
        className="absolute inset-0"
        onClick={() => setCustomAccountModalIdx(null)}
      />
      <div
        ref={customAccountRef}
        className={cn(
          "relative w-full max-w-md bg-white dark:bg-slate-900 border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col p-6 transition-all rounded-[2rem]",
          "animate-in zoom-in-95 duration-200"
        )}
        dir={dir}
      >
        <h3 id="custom-account-title" className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {language === 'ar' ? 'إضافة حساب جديد' : 'Add New Account'}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-custom-account-name" className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-theme-muted">
              {language === 'ar' ? 'اسم الحساب' : 'Account Name'}
            </label>
            <input
              id="new-custom-account-name"
              type="text"
              autoFocus
              value={newCustomAccountName}
              onChange={e => setNewCustomAccountName(e.target.value)}
              className="w-full px-4 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-950/60 bg-white dark:text-white text-slate-900 font-bold transition-colors"
              placeholder={language === 'ar' ? 'مثال: أراضي زراعية، قرض بنكي...' : 'e.g. Land, Bank Loan...'}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-theme-muted">
              {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
            </label>
            <div className="flex dark:bg-slate-950 bg-slate-100 p-1 rounded-2xl border dark:border-white/5 border-slate-200 w-full shadow-inner">
              {(['asset', 'liability', 'equity'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCustomAccountCategory(cat)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                    newCustomAccountCategory === cat
                      ? cat === 'asset'
                        ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-[1.02]"
                        : cat === 'liability'
                          ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-[1.02]"
                          : "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]"
                      : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600"
                  )}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setCustomAccountModalIdx(null)}
            className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={async () => {
              const newAcc = await addCustomAccount(newCustomAccountName, newCustomAccountCategory);
              if (newAcc) {
                handleImpactChange(customAccountModalIdx, 'accountId', newAcc.id);
                setCustomAccountModalIdx(null);
              }
            }}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
          >
            {language === 'ar' ? 'إضافة الحساب' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
