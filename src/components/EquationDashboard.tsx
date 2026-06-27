import React from 'react';
import { CheckCircle2, AlertCircle, Target, Edit2, Save } from 'lucide-react';
import { useLanguage } from '../i18n';
import { Account, Category } from '../types/accounting';
import { cn } from '../utils/cn';

interface EquationDashboardProps {
  totals: {
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    accounts: Record<string, number>;
  };
  budgets: Record<string, number>;
  setBudgets: (budgets: Record<string, number>) => void;
  isEditingBudgets: boolean;
  setIsEditingBudgets: (val: boolean) => void;
  handleSaveBudgets: () => void;
  activeAccounts: Account[];
  formatCurrency: (val: number) => string;
}

export const EquationDashboard: React.FC<EquationDashboardProps> = ({
  totals,
  budgets,
  setBudgets,
  isEditingBudgets,
  setIsEditingBudgets,
  handleSaveBudgets,
  activeAccounts,
  formatCurrency
}) => {
  const { t } = useLanguage();

  return (
    <div className="hidden md:block xl:col-span-4 space-y-6 animate-fade-in [animation-delay:400ms]">
      {/* Balance Equation Status Visualization */}
      <div className={cn(
        "rounded-[2.5rem] shadow-2xl border-2 p-8 transition-all duration-700 backdrop-blur-3xl overflow-hidden relative group/card",
        totals.isBalanced
          ? "dark:bg-emerald-950/20 bg-emerald-50 border-emerald-500/30 dark:shadow-[0_0_30px_rgba(16,185,129,0.12)] shadow-[0_0_20px_rgba(16,185,129,0.06)]"
          : "dark:bg-rose-950/20 bg-rose-50 border-rose-500/30 dark:shadow-[0_0_30px_rgba(244,63,94,0.12)] shadow-[0_0_20px_rgba(244,63,94,0.06)]"
      )}>
        {/* Background Glow */}
        <div className={cn(
          "absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full transition-all duration-1000 group-hover/card:scale-125",
          totals.isBalanced ? "bg-emerald-500" : "bg-rose-500"
        )}></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className={cn(
            "p-5 rounded-[2rem] shadow-2xl transition-all duration-500",
            totals.isBalanced ? "bg-emerald-500/20 text-emerald-400 group-hover/card:scale-105" : "bg-rose-500/20 text-rose-400 animate-pulse-slow"
          )}>
            {totals.isBalanced ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className={cn(
              "text-2xl font-bold mb-2 tracking-tight",
              totals.isBalanced ? "text-emerald-400" : "text-rose-400"
            )}>
              {totals.isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="dark:bg-slate-950/40 bg-white p-5 rounded-3xl border dark:border-white/5 border-slate-200 group hover:border-indigo-500/30 transition-all shadow-sm">
                <span className="text-[10px] uppercase font-bold block mb-2 tracking-widest text-theme-muted">{t('totalAssets')}</span>
                <span className="text-xl font-bold dark:text-white text-slate-900" dir="ltr">{formatCurrency(totals.totalAssets)}</span>
              </div>
              <div className="dark:bg-slate-950/40 bg-white p-5 rounded-3xl border dark:border-white/5 border-slate-200 group hover:border-indigo-500/30 transition-all shadow-sm">
                <span className="text-[10px] uppercase font-bold block mb-2 tracking-widest text-theme-muted">{t('totalLiabilitiesEquity')}</span>
                <span className="text-xl font-bold dark:text-white text-slate-900" dir="ltr">{formatCurrency(totals.totalLiabilities + totals.totalEquity)}</span>
              </div>
            </div>

            {!totals.isBalanced && (
              <div className="mt-6 p-5 dark:bg-rose-500/10 bg-white rounded-3xl border dark:border-rose-500/20 border-rose-200 flex flex-col sm:flex-row justify-between items-center gap-2 group hover:dark:bg-rose-500/20 hover:bg-rose-50 transition-all shadow-sm">
                <span className="text-xs font-bold dark:text-rose-300 text-rose-500 uppercase tracking-widest">{t('difference')}</span>
                <span className="text-2xl font-bold text-rose-400 drop-shadow-lg" dir="ltr">{formatCurrency(Math.abs(totals.totalAssets - (totals.totalLiabilities + totals.totalEquity)))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Status Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            {t('budgetAlerts')}
          </h2>
          <button
            onClick={() => isEditingBudgets ? handleSaveBudgets() : setIsEditingBudgets(true)}
            className="dark:text-white text-slate-500 hover:text-indigo-600 transition-colors p-1"
            title={isEditingBudgets ? t('save') : t('editBudgets')}
          >
            {isEditingBudgets ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-6">
          {(['asset', 'liability', 'equity'] as Category[]).map(category => {
            const categoryAccounts = activeAccounts.filter(a => a.category === category);
            if (categoryAccounts.length === 0) return null;

            const catAllocated = categoryAccounts.reduce((sum, a) => sum + (budgets[a.id] || 0), 0);
            const catSpent = category === 'asset' ? totals.totalAssets : category === 'liability' ? totals.totalLiabilities : totals.totalEquity;
            const absCatSpent = Math.abs(catSpent);
            const catPercentage = catAllocated > 0 ? (absCatSpent / catAllocated) * 100 : 0;
            const catIsOverBudget = catAllocated > 0 && absCatSpent > catAllocated;
            const catIsApproachingBudget = catAllocated > 0 && catPercentage >= 85 && !catIsOverBudget;

            return (
              <div key={category} className={cn(
                "p-5 rounded-3xl border transition-colors duration-300",
                catIsOverBudget ? "bg-rose-50 border-rose-200" : catIsApproachingBudget ? "bg-amber-55 bg-amber-50 border-amber-200" : "bg-slate-800/20 border-white/5"
              )}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={cn(
                    "text-[15px] font-bold flex items-center gap-1.5",
                    catIsOverBudget ? "text-rose-800" : catIsApproachingBudget ? "text-amber-800" : "dark:text-white text-slate-900"
                  )}>
                    {t(category)}
                    {catIsOverBudget && <AlertCircle className="w-4 h-4 text-rose-500" />}
                    {catIsApproachingBudget && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </h3>
                  <span className={cn(
                    "text-sm font-medium font-bold",
                    catIsOverBudget ? "text-rose-700" : catIsApproachingBudget ? "text-amber-700" : "dark:text-white text-slate-900"
                  )} dir="ltr">
                    {formatCurrency(absCatSpent)} {catAllocated > 0 && `/ ${formatCurrency(catAllocated)}`}
                  </span>
                </div>

                {/* Category Progress Bar */}
                {catAllocated > 0 && !isEditingBudgets && (
                  <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden flex mb-4">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        catIsOverBudget ? "bg-rose-500 animate-pulse" : catIsApproachingBudget ? "bg-amber-500" : "bg-indigo-500"
                      )}
                      style={{ width: `${Math.min(catPercentage, 100)}%` }}
                    />
                  </div>
                )}

                {/* Individual Accounts */}
                <div className={cn(
                  "space-y-3 mt-3 pt-3 border-t",
                  catIsOverBudget ? "border-rose-200/60" : catIsApproachingBudget ? "border-amber-200/60" : "border-white/10"
                )}>
                  {categoryAccounts.map(account => {
                    const allocated = budgets[account.id] || 0;
                    const spent = Math.abs(totals.accounts[account.id] || 0);
                    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
                    const isOverBudget = allocated > 0 && spent > allocated;
                    const isApproachingBudget = allocated > 0 && percentage >= 85 && !isOverBudget;

                    return (
                      <div key={account.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[15px]">
                          <span className={cn(
                            "font-medium text-sm font-medium flex items-center gap-1",
                            isOverBudget ? "text-rose-700" : isApproachingBudget ? "text-amber-700" : "dark:text-white text-slate-900"
                          )}>
                            {t(account.name)}
                            {isOverBudget && <AlertCircle className="w-3 h-3 text-rose-500" />}
                            {isApproachingBudget && <AlertCircle className="w-3 h-3 text-amber-500" />}
                          </span>
                          {isEditingBudgets ? (
                            <input
                              id={`budget-${account.id}`}
                              name={`budget-${account.id}`}
                              type="number"
                              value={allocated || ''}
                              onChange={(e) => setBudgets({ ...budgets, [account.id]: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border border-white/20 rounded text-left text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                              dir="ltr"
                              placeholder="0"
                              aria-label={`${t('budgetAlerts')} - ${t(account.name)}`}
                            />
                          ) : (
                            <span className="dark:text-white text-slate-900 text-[11px]" dir="ltr">
                              <span className={cn("font-bold", isOverBudget ? 'text-rose-600' : isApproachingBudget ? 'text-amber-600' : 'dark:text-white text-slate-900')}>
                                {formatCurrency(spent)}
                              </span>
                              {allocated > 0 && ` / ${formatCurrency(allocated)}`}
                            </span>
                          )}
                        </div>
                        {!isEditingBudgets && allocated > 0 && (
                          <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden flex">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                isOverBudget ? "bg-rose-500 animate-pulse" : isApproachingBudget ? "bg-amber-500" : "bg-emerald-400"
                              )}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
