import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Account, Impact } from '../../types/accounting';
import { cn } from '../../utils/cn';

interface ImpactRowProps {
  impact: Omit<Impact, 'id'>;
  idx: number;
  allAccounts: Account[];
  handleImpactChange: (index: number, field: keyof Omit<Impact, 'id'>, value: string | number) => void;
  handleRemoveImpact: (index: number) => void;
  setCustomAccountModalIdx: (index: number) => void;
  t: (key: string) => string;
  language: string;
  error?: string;
  amountError?: string;
}

const parseArabicNumerals = (str: string) => {
  return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
};

export const ImpactRow: React.FC<ImpactRowProps> = ({
  impact,
  idx,
  allAccounts,
  handleImpactChange,
  handleRemoveImpact,
  setCustomAccountModalIdx,
  t,
  language,
  error,
  amountError
}) => {
  const [localAmount, setLocalAmount] = React.useState(impact.amount ? impact.amount.toString() : '');
  const [prevImpactAmount, setPrevImpactAmount] = React.useState(impact.amount);

  if (impact.amount !== prevImpactAmount) {
    setPrevImpactAmount(impact.amount);
    if (impact.amount === 0) {
      if (localAmount !== '' && localAmount !== '0' && localAmount !== '0.' && localAmount !== '.') {
        setLocalAmount('');
      }
    } else {
      if (parseFloat(localAmount) !== impact.amount) {
        setLocalAmount(impact.amount.toString());
      }
    }
  }
  return (
    <div className="relative group/impact">
      <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl -m-2 opacity-0 group-hover/impact:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 shadow-sm transition-all hover:border-slate-200 dark:hover:border-white/10">
        <div className="flex-1 w-full relative">
          <label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'الحساب المتأثر' : 'Affected Account'}
          </label>
          <div className="relative">
            <select
              value={impact.accountId}
              onChange={e => {
                if (e.target.value === 'ADD_NEW_ACCOUNT') {
                  setCustomAccountModalIdx(idx);
                } else {
                  handleImpactChange(idx, 'accountId', e.target.value);
                }
              }}
              className={cn(
                "w-full px-4 py-3 border rounded-xl text-sm font-bold transition-all appearance-none outline-none focus:ring-2",
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm hover:border-slate-300 dark:hover:border-slate-600",
                error
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/50 dark:focus:border-rose-500 dark:focus:ring-rose-900"
                  : "border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
              )}
            >
              <option value="">{t('selectAccount')}</option>
              {allAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{t(acc.name)}</option>
              ))}
              <option value="ADD_NEW_ACCOUNT" className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20">
                + {language === 'ar' ? 'إضافة حساب جديد...' : 'Add New Account...'}
              </option>
            </select>
            <div className="absolute top-1/2 -translate-y-1/2 left-3 rtl:right-3 rtl:left-auto pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            {error && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 rtl:left-8 rtl:right-auto text-rose-500">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          {error && <p className="text-rose-500 text-[10px] mt-1 text-right font-bold absolute -bottom-5 right-0">{t(error)}</p>}
        </div>

        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto items-end">
          <div className="flex-1 sm:w-40 relative">
            <label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'المبلغ' : 'Amount'}
            </label>
            <div className="relative group flex items-center">
              <button
                type="button"
                onClick={() => {
                  const val = impact.amount || 0;
                  handleImpactChange(idx, 'amount', val - 1);
                }}
                className="absolute left-1 z-10 p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors rtl:right-1 rtl:left-auto"
                aria-label="Decrease amount"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg>
              </button>
              
              <input
                type="text"
                inputMode="decimal"
                value={localAmount}
                onChange={e => {
                  const val = parseArabicNumerals(e.target.value);
                  if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                    setLocalAmount(val);
                    handleImpactChange(idx, 'amount', val === '' || val === '.' || val === '-' || val === '-.' ? 0 : parseFloat(val));
                  }
                }}
                className={cn(
                  "w-full px-10 py-3 border rounded-xl text-sm font-black transition-all outline-none focus:ring-2 text-center",
                  "bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-600",
                  amountError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-600 dark:border-rose-500/50 dark:focus:border-rose-500 dark:focus:ring-rose-900"
                    : "border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white",
                  (() => {
                    const account = allAccounts.find(a => a.id === impact.accountId);
                    if (!account || !impact.amount) return "";
                    const isDebit = (account.category === 'asset' && impact.amount > 0) || (account.category !== 'asset' && impact.amount < 0);
                    return isDebit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
                  })()
                )}
                placeholder="0"
              />
              
              <button
                type="button"
                onClick={() => {
                  const val = impact.amount || 0;
                  handleImpactChange(idx, 'amount', val + 1);
                }}
                className="absolute right-1 z-10 p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors rtl:left-1 rtl:right-auto"
                aria-label="Increase amount"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </button>

              {/* Indicator Dot */}
              {impact.accountId && impact.amount !== 0 && (() => {
                const account = allAccounts.find(a => a.id === impact.accountId);
                if (!account) return null;
                const isDebit = (account.category === 'asset' && impact.amount > 0) || (account.category !== 'asset' && impact.amount < 0);
                return (
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                    language === 'ar' ? "left-8" : "right-8",
                    isDebit ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  )} />
                );
              })()}
            </div>
            {amountError && <p className="text-rose-500 text-[10px] mt-1 text-right font-bold absolute -bottom-5 right-0">{t(amountError)}</p>}
          </div>

          <button
            type="button"
            onClick={() => handleRemoveImpact(idx)}
            className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all h-[46px] border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 self-end"
            title={t('remove')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
