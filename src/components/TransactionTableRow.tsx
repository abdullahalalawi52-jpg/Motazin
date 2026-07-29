import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Transaction, Account } from '../types/accounting';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/date';
import { useLanguage } from '../i18n';

interface TransactionTableRowProps {
  tx: Transaction;
  selectedTransactions: Set<string>;
  handleSelectTransaction: (id: string) => void;
  t: (key: string) => string;
  setPreviewUrl: (url: string | null) => void;
  setIsDocPreviewOpen: (open: boolean) => void;
  assets: Account[];
  liabilities: Account[];
  equities: Account[];
  incomes?: Account[];
  expenses?: Account[];
  getImpactAmount: (tx: Transaction, accountId: string) => number;
  formatCurrency: (val: number) => string;
  handleEditTransaction: (tx: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
}

export const TransactionTableRow: React.FC<TransactionTableRowProps> = ({
  tx,
  selectedTransactions,
  handleSelectTransaction,
  t,
  setPreviewUrl,
  setIsDocPreviewOpen,
  assets,
  liabilities,
  equities,
  incomes = [],
  expenses = [],
  getImpactAmount,
  formatCurrency,
  handleEditTransaction,
  handleDeleteTransaction
}) => {
  const { language } = useLanguage();
  return (
    <tr className="dark:even:bg-white/5 even:bg-slate-100/20 dark:hover:bg-slate-700/50 hover:bg-slate-100/80 transition-colors group">
      <td className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center">
        <input
          id={`select-tx-${tx.id}`}
          name={`selectTx-${tx.id}`}
          type="checkbox"
          checked={selectedTransactions.has(tx.id)}
          onChange={() => handleSelectTransaction(tx.id)}
          className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          aria-label={`${t('select')} ${tx.description}`}
        />
      </td>
      <td className="p-3 border-l dark:border-white/5 border-slate-200/30 whitespace-nowrap dark:text-white text-slate-800 text-center">
        <span dir="ltr" className="inline-block transform -translate-y-[3px]">{formatDate(tx.date, language === 'ar' ? 'ar-SA' : 'en-GB')}</span>
      </td>
      <td className="p-3 border-l dark:border-white/5 border-slate-200/30 dark:text-white text-slate-850">
        <div className="flex items-center gap-2">
          {tx.description}
          {tx.isRecurring && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700" title={`${t('repeatsEveryLabel')} ${t(tx.recurrenceInterval || 'monthly')}`}>
              {t('recurring')}
            </span>
          )}
          {tx.attachmentUrl && (
            <button
              onClick={() => {
                setPreviewUrl(tx.attachmentUrl || null);
                setIsDocPreviewOpen(true);
              }}
              className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
              title={t('viewDocument')}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>

      {assets.map(a => {
        const amt = getImpactAmount(tx, a.id);
        return (
          <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-indigo-500/5 transition-colors" dir="ltr">
            {amt !== 0 ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
              )}>
                {formatCurrency(amt)}
              </span>
            ) : (
              <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
            )}
          </td>
        );
      })}

      {liabilities.map(a => {
        const amt = getImpactAmount(tx, a.id);
        return (
          <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-amber-500/5 transition-colors" dir="ltr">
            {amt !== 0 ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
              )}>
                {formatCurrency(amt)}
              </span>
            ) : (
              <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
            )}
          </td>
        );
      })}

      {equities.map(a => {
        const amt = getImpactAmount(tx, a.id);
        return (
          <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-emerald-500/5 transition-colors" dir="ltr">
            {amt !== 0 ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
              )}>
                {formatCurrency(amt)}
              </span>
            ) : (
              <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
            )}
          </td>
        );
      })}

      {incomes.map(a => {
        const amt = getImpactAmount(tx, a.id);
        return (
          <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-sky-500/5 transition-colors" dir="ltr">
            {amt !== 0 ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                amt > 0 ? "bg-sky-500/10 dark:text-sky-400 text-sky-700 border border-sky-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
              )}>
                {formatCurrency(amt)}
              </span>
            ) : (
              <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
            )}
          </td>
        );
      })}

      {expenses.map(a => {
        const amt = getImpactAmount(tx, a.id);
        return (
          <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-rose-500/5 transition-colors" dir="ltr">
            {amt !== 0 ? (
              <span className={cn(
                "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                amt > 0 ? "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20" : "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20"
              )}>
                {formatCurrency(amt)}
              </span>
            ) : (
              <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
            )}
          </td>
        );
      })}

      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => handleEditTransaction(tx)}
            className="p-1.5 dark:text-white text-slate-600 hover:text-indigo-600 dark:hover:bg-slate-800 hover:bg-slate-200/55 rounded transition-colors"
            title={t('editTransaction')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteTransaction(tx.id)}
            className="p-1.5 dark:text-white text-slate-600 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-200/55 rounded transition-colors"
            title={t('deleteTransaction')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
