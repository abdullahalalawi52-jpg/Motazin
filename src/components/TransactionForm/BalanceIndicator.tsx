import React from 'react';
import { Calculator } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BalanceIndicatorProps {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  t: (key: string) => string;
  language: string;
}

export const BalanceIndicator: React.FC<BalanceIndicatorProps> = ({
  totalDebits,
  totalCredits,
  isBalanced,
  t,
  language
}) => {
  const isZero = totalDebits === 0 && totalCredits === 0;

  return (
    <div className="glass p-3 rounded-xl flex flex-col gap-2 sticky top-0 z-20 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-500" />
          {t('balanceIndicator')}
        </h4>
        <span className={cn(
          "px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black tracking-widest uppercase transition-colors shadow-sm whitespace-nowrap overflow-hidden text-ellipsis",
          isZero ? "bg-slate-100 dark:bg-slate-800 text-slate-500" :
          isBalanced ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse-slow"
        )}>
          {isZero ? (language === 'ar' ? 'بانتظار الإدخال' : 'Awaiting Input') : isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
        </span>
      </div>
      
      <div className="flex gap-4 px-1">
        <div className="flex-1 flex items-center justify-between text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
          <span className="text-emerald-600 dark:text-emerald-400">{t('debit')}</span>
          <span className="text-emerald-700 dark:text-emerald-300 font-black">{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        </div>

        <div className="flex-1 flex items-center justify-between text-[11px] font-bold bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
          <span className="text-rose-600 dark:text-rose-400">{t('credit')}</span>
          <span className="text-rose-700 dark:text-rose-300 font-black">{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};
