import React from 'react';
import { Undo2, Redo2, FileSearch, Calculator, Trash2, FileSpreadsheet, FileText, Eye, Edit2 } from 'lucide-react';
import { useLanguage } from '../i18n';
import { Account, Transaction } from '../types/accounting';
import { cn } from '../utils/cn';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedTransactions: Set<string>;
  historyIndex: number;
  historyLength: number;
  handleUndo: () => void;
  handleRedo: () => void;
  setIsPdfScannerOpen: (open: boolean) => void;
  setIsDepreciationModalOpen: (open: boolean) => void;
  handleBulkDelete: () => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
  assets: Account[];
  liabilities: Account[];
  equities: Account[];
  totals: {
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    accounts: Record<string, number>;
  };
  formatCurrency: (val: number) => string;
  allAccounts: Account[];
  handleEditTransaction: (tx: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
  handleSelectTransaction: (id: string) => void;
  handleSelectAll: () => void;
  setPreviewUrl: (url: string | null) => void;
  setIsDocPreviewOpen: (open: boolean) => void;
  currency: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedTransactions,
  historyIndex,
  historyLength,
  handleUndo,
  handleRedo,
  setIsPdfScannerOpen,
  setIsDepreciationModalOpen,
  handleBulkDelete,
  handleExportCSV,
  handleExportPDF,
  assets,
  liabilities,
  equities,
  totals,
  formatCurrency,
  allAccounts,
  handleEditTransaction,
  handleDeleteTransaction,
  handleSelectTransaction,
  handleSelectAll,
  setPreviewUrl,
  setIsDocPreviewOpen,
  currency
}) => {
  const { t, language } = useLanguage();

  const getImpactAmount = (tx: Transaction, accountId: string) => {
    const impact = tx.impacts.find(i => i.accountId === accountId);
    if (!impact) return 0;
    if (impact.type) {
      const account = allAccounts.find(a => a.id === accountId);
      const isCredit = impact.type === 'credit';
      if (account) {
        if (account.category === 'asset') {
          return isCredit ? -impact.amount : impact.amount;
        } else {
          return isCredit ? impact.amount : -impact.amount;
        }
      }
      return impact.amount;
    }
    return impact.amount;
  };

  return (
    <div className="xl:col-span-8">
      <div className="glass-card overflow-hidden flex flex-col h-full" style={{ borderRadius: '1.5rem' }}>
        <div className="p-4 border-b dark:border-white/10 border-slate-200 dark:bg-slate-800/20 bg-slate-100/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 dark:bg-white/5 bg-slate-100 p-1 rounded-xl border dark:border-white/10 border-slate-200">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 disabled:opacity-20 transition-all active:scale-90"
                title={language === 'ar' ? "تراجع" : "Undo"}
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyLength - 1}
                className="p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 disabled:opacity-20 transition-all active:scale-90"
                title={language === 'ar' ? "إعادة التعديل المتراجع عنه" : "Redo"}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsPdfScannerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-xs font-black dark:bg-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
              title={t('importFiles')}
            >
              <FileSearch className="w-4 h-4" />
              <span>{t('scanPDF') || 'Scan PDF'}</span>
            </button>

            <button
              onClick={() => setIsDepreciationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-xs font-black dark:bg-amber-500 bg-amber-500 text-white hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest"
              title={t('depreciationCalc')}
            >
              <Calculator className="w-4 h-4" />
              <span>{t('depreciationCalc')}</span>
            </button>
          </div>
          {transactions.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-2">
              {selectedTransactions.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium text-white bg-rose-600 border border-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                  title={t('deleteSelected')}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('deleteSelected')} ({selectedTransactions.size})
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 dark:bg-slate-800/40 bg-white dark:hover:bg-indigo-600/50 hover:bg-indigo-50 dark:text-white text-slate-900 font-bold rounded-xl border dark:border-white/10 border-slate-300 transition-all shadow-sm group"
                title={t('exportCSV')}
              >
                <FileSpreadsheet className="w-5 h-5 dark:text-white text-slate-900 group-hover:text-indigo-600" />
                <span className="sr-only sm:not-sr-only">{t('exportCSV')}</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2.5 dark:bg-slate-800/40 bg-white dark:hover:bg-rose-600/50 hover:bg-rose-50 dark:text-white text-slate-900 font-bold rounded-xl border dark:border-white/10 border-slate-300 transition-all shadow-sm group"
                title={t('exportPDF')}
              >
                <FileText className="w-5 h-5 dark:text-white text-slate-900 group-hover:text-rose-600" />
                <span className="sr-only sm:not-sr-only">PDF</span>
              </button>
            </div>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-transparent">
            <div className="p-6 bg-slate-200/50 dark:bg-white/5 rounded-full mb-6 border border-slate-300 dark:border-white/10">
              <Calculator className="w-12 h-12 text-slate-400 dark:text-white/20" />
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-white mb-2">{t('noTransactions')}</p>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-xs">{t('addTransactionPrompt')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div id="transactions-table" className="hidden md:block overflow-auto flex-1 relative dark:bg-slate-800/40 bg-white">
              <table className="w-full text-[15px] text-right border-collapse">
                <thead className="sticky top-0 z-20 dark:text-white text-slate-800 shadow-sm ring-1 dark:ring-white/10 ring-slate-200/50">
                  {/* Category Headers */}
                  <tr className="border-b dark:border-white/10 border-slate-200 ring-1 dark:ring-white/5 ring-slate-100/50">
                    <th className="p-4 border-l dark:border-white/5 border-slate-200/50 w-10 dark:bg-slate-900/40 bg-slate-100/80 text-center">
                      <input
                        id="select-all-transactions"
                        name="selectAll"
                        type="checkbox"
                        checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                        onChange={handleSelectAll}
                        className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={t('selectAll') || 'Select All'}
                      />
                    </th>
                    <th className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest w-24 dark:bg-slate-900/40 bg-slate-100/80 text-center">{t('date')}</th>
                    <th className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest min-w-[200px] dark:bg-slate-900/40 bg-slate-100/80">{t('description')}</th>

                    {assets.length > 0 && (
                      <th colSpan={assets.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-indigo-500/10 dark:text-indigo-300 text-indigo-950">
                        {t('assets')}
                      </th>
                    )}

                    {liabilities.length > 0 && (
                      <th colSpan={liabilities.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-amber-500/10 dark:text-amber-300 text-amber-950">
                        {t('liabilities')}
                      </th>
                    )}

                    {equities.length > 0 && (
                      <th colSpan={equities.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-emerald-500/10 dark:text-emerald-300 text-emerald-950">
                        {t('equity')}
                      </th>
                    )}
                    <th className="p-3 w-10 dark:bg-slate-900/40 bg-slate-100/80"></th>
                  </tr>
                  {/* Account Headers */}
                  <tr className="border-b dark:border-white/5 border-slate-200/30">
                    <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>
                    <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>
                    <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>

                    {assets.map(a => (
                      <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-indigo-400 text-indigo-900 bg-indigo-500/5">{t(a.name)}</th>
                    ))}

                    {liabilities.map(a => (
                      <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-amber-400 text-amber-900 bg-amber-500/5">{t(a.name)}</th>
                    ))}

                    {equities.map(a => (
                      <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-emerald-400 text-emerald-900 bg-emerald-500/5">{t(a.name)}</th>
                    ))}
                    <th className="dark:bg-slate-900/20 bg-slate-50/50"></th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-200/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="dark:even:bg-white/5 even:bg-slate-100/20 dark:hover:bg-slate-700/50 hover:bg-slate-100/80 transition-colors group">
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
                      <td className="p-3 border-l dark:border-white/5 border-slate-200/30 whitespace-nowrap dark:text-white text-slate-800 text-center"><span dir="ltr" className="inline-block transform -translate-y-[3px]">{tx.date}</span></td>
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
                  ))}
                </tbody>
                {/* Totals Row */}
                <tfoot className="sticky bottom-0 z-20 bg-slate-900 border-t-2 dark:border-white/10 border-slate-800 font-bold shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                  <tr>
                    <td colSpan={3} className="p-4 border-l dark:border-white/5 border-slate-800 text-left text-white/90 bg-slate-900/60 uppercase tracking-widest text-[11px]">
                      {t('grandTotal')}
                    </td>

                    {assets.map(a => (
                      <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-indigo-400 text-white font-mono bg-indigo-500/5" dir="ltr">
                        {formatCurrency(totals.accounts[a.id])}
                      </td>
                    ))}

                    {liabilities.map(a => (
                      <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-amber-400 text-white font-mono bg-amber-500/5" dir="ltr">
                        {formatCurrency(totals.accounts[a.id])}
                      </td>
                    ))}

                    {equities.map(a => (
                      <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-emerald-400 text-white font-mono bg-emerald-500/5" dir="ltr">
                        {formatCurrency(totals.accounts[a.id])}
                      </td>
                    ))}
                    <td className="bg-slate-900/60"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View - Enhanced Design */}
            <div className="md:hidden flex flex-col gap-5 responsive-px py-6 bg-slate-50/50 dark:bg-slate-950/20">
              {transactions.map((tx) => (
                <div key={tx.id} className="mobile-card !mb-0 group overflow-hidden border dark:border-white/10 border-slate-200 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-none p-5 rounded-[2rem]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative mt-1">
                        <input
                          id={`mob-select-tx-${tx.id}`}
                          name={`mob-selectTx-${tx.id}`}
                          type="checkbox"
                          checked={selectedTransactions.has(tx.id)}
                          onChange={() => handleSelectTransaction(tx.id)}
                          className="rounded-lg border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-6 h-6 transition-all"
                          aria-label={`${t('select')} ${tx.description}`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.15em] mb-1.5" dir="ltr">{tx.date}</span>
                        <p className="text-[16px] font-black dark:text-white text-slate-900 leading-snug">{tx.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTransaction(tx)}
                        className="p-3 dark:text-indigo-400 text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all active:scale-90"
                        title={t('editTransaction')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 py-4 border-t dark:border-white/10 border-slate-100">
                    {tx.impacts.map((imp, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
                        imp.amount > 0
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                          : "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
                      )}>
                        <span className={cn(
                          "text-[11px] font-bold",
                          imp.amount > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                        )}>
                          {t(allAccounts.find(a => a.id === imp.accountId)?.name || '')}
                        </span>
                        <div className={cn("w-1 h-1 rounded-full", imp.amount > 0 ? "bg-emerald-400" : "bg-rose-400")}></div>
                        <span className={cn(
                          "font-black font-mono text-[12px]",
                          imp.amount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                        )} dir="ltr">
                          {formatCurrency(imp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {tx.attachmentUrl && (
                      <button
                        onClick={() => {
                          setPreviewUrl(tx.attachmentUrl || null);
                          setIsDocPreviewOpen(true);
                        }}
                        className="flex-1 py-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 border-slate-200 text-[10px] font-black uppercase tracking-widest dark:text-indigo-400 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {t('viewAttachment') || 'View Attachment'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-3 dark:text-rose-400 text-rose-600 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90 border border-rose-500/20 shadow-sm"
                      title={t('deleteTransaction')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Final Equation Summary */}
        {transactions.length > 0 && (
          <div className="dark:bg-slate-900/60 bg-slate-50/90 backdrop-blur-md border-t dark:border-white/10 border-slate-200 dark:text-white text-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 font-mono text-lg animate-fade-in">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('assets')}</span>
              <span className="dark:text-indigo-300 text-indigo-600 font-bold">{formatCurrency(totals.totalAssets)}</span>
            </div>
            <span className="dark:text-white text-slate-400">=</span>
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('liabilities')}</span>
              <span className="dark:text-amber-300 text-amber-600 font-bold">{formatCurrency(totals.totalLiabilities)}</span>
            </div>
            <span className="dark:text-white text-slate-400">+</span>
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('equity')}</span>
              <span className="dark:text-emerald-300 text-emerald-600 font-bold">{formatCurrency(totals.totalEquity)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
