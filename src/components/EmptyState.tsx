import React from 'react';
import { useLanguage, TranslationKey } from '../i18n';
import { FileSpreadsheet, Calculator, Percent } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  titleKey?: TranslationKey;
  subtitleKey?: TranslationKey;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  titleKey = 'noTransactions', 
  subtitleKey = 'addTransactionPrompt',
  action 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[350px] w-full">
      <div className="relative mb-6 mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse-slow"></div>
        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center shadow-xl border border-white/80 dark:border-white/10">
           {icon || <FileSpreadsheet className="w-10 h-10 text-indigo-500 dark:text-indigo-400 opacity-90" />}
           
           {!icon && (
             <>
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 animate-float" style={{ animationDelay: '0s' }}>
                 <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
               </div>
               <div className="absolute -bottom-1 -left-2 w-6 h-6 bg-amber-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 animate-float" style={{ animationDelay: '1s' }}>
                 <Percent className="w-3 h-3 text-amber-500 dark:text-amber-400" />
               </div>
             </>
           )}
        </div>
      </div>
      
      <h3 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
        {t(titleKey)}
      </h3>
      <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 max-w-[250px] mb-4">
        {t(subtitleKey)}
      </p>
      
      {action}
    </div>
  );
};
