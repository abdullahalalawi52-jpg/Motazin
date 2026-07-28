import React from 'react';
import { useLanguage } from '../i18n';
import { cn } from '../utils/cn';

interface TransactionRecurrenceFieldsProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurrenceInterval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setRecurrenceInterval: (value: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  isModal?: boolean;
}

export const TransactionRecurrenceFields: React.FC<TransactionRecurrenceFieldsProps> = ({
  isRecurring,
  setIsRecurring,
  recurrenceInterval,
  setRecurrenceInterval,
  isModal = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border w-fit transition-colors duration-300",
      isRecurring 
        ? "bg-indigo-50/80 border-indigo-200/80 dark:bg-indigo-500/10 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/5" 
        : "bg-slate-50/50 border-slate-200/60 dark:bg-slate-800/30 dark:border-white/5 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
    )}>
      <label htmlFor={isModal ? "mob-tx-recurring" : "dt-tx-recurring"} className="flex items-center gap-3 cursor-pointer group">
        <div className={cn(
          "flex items-center justify-center rounded-lg border-2 transition-all duration-300 flex-shrink-0",
          isModal ? "w-6 h-6" : "w-5 h-5 sm:w-5 sm:h-5",
          isRecurring 
            ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)]" 
            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-400"
        )}>
          <svg 
            className={cn(
              "text-white transition-all duration-300 transform", 
              isModal ? "w-4 h-4" : "w-3.5 h-3.5",
              isRecurring ? "scale-100 opacity-100" : "scale-50 opacity-0"
            )} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <input
          id={isModal ? "mob-tx-recurring" : "dt-tx-recurring"}
          name={isModal ? "mob-isRecurring" : "dt-isRecurring"}
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="sr-only"
        />
        <span className={cn("text-sm font-bold dark:text-white text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors uppercase tracking-tight whitespace-nowrap", isModal && "font-black")}>{t('recurringTransaction')}</span>
      </label>

      {isRecurring && (
        <div className={cn(
          "flex items-center gap-3 animate-fade-in ps-3 border-s border-indigo-500/10 dark:border-white/10",
          isModal && "pt-3 border-t border-s-0 border-indigo-500/10 w-full"
        )}>
          <label htmlFor={isModal ? "mob-tx-recurrence-interval" : "dt-tx-recurrence-interval"} className={cn("text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-widest", isModal && "font-black text-slate-500")}>{t('repeatsEveryLabel')}</label>
          <select
            id={isModal ? "mob-tx-recurrence-interval" : "dt-tx-recurrence-interval"}
            name={isModal ? "mob-recurrenceInterval" : "dt-recurrenceInterval"}
            value={recurrenceInterval}
            onChange={(e) => setRecurrenceInterval(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
            className={cn(
              "px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white text-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
              isModal && "flex-1 py-2.5 font-black"
            )}
          >
            <option value="daily">{t('day')}</option>
            <option value="weekly">{t('week')}</option>
            <option value="monthly">{t('month')}</option>
            <option value="yearly">{t('year')}</option>
          </select>
        </div>
      )}
    </div>
  );
};
