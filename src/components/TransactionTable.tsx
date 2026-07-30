import React, { useRef, useMemo } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { FileSearch, Calculator, Trash2, FileSpreadsheet, FileText, Eye, Edit2, Percent } from 'lucide-react';
import { useLanguage } from '../i18n';
import { Account, Transaction } from '../types/accounting';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/date';
import { TransactionTableRow } from './TransactionTableRow';
import { useAppStore } from '../store/useAppStore';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedTransactions: Set<string>;
  setIsPdfScannerOpen: (open: boolean) => void;
  setIsDepreciationModalOpen: (open: boolean) => void;
  setIsVatModalOpen: (open: boolean) => void;
  handleBulkDelete: () => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
  assets: Account[];
  liabilities: Account[];
  equities: Account[];
  incomes?: Account[];
  expenses?: Account[];
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
}

export const TransactionTable: React.FC<TransactionTableProps> = React.memo(({
  transactions,
  selectedTransactions,
  setIsPdfScannerOpen,
  setIsDepreciationModalOpen,
  setIsVatModalOpen,
  handleBulkDelete,
  handleExportCSV,
  handleExportPDF,
  assets,
  liabilities,
  equities,
  incomes = [],
  expenses = [],
  totals,
  formatCurrency,
  allAccounts,
  handleEditTransaction,
  handleDeleteTransaction,
  handleSelectTransaction,
  handleSelectAll,
  setPreviewUrl,
  setIsDocPreviewOpen
}) => {
  const { t, language } = useLanguage();
  const hasAccounts = assets.length > 0 || liabilities.length > 0 || equities.length > 0 || incomes.length > 0 || expenses.length > 0;

  const parentRef = useRef<HTMLDivElement>(null);
  const { globalSearchTerm, setGlobalSearchTerm } = useAppStore();

  const processedTransactions = useMemo(() => {
    if (!globalSearchTerm.trim()) return transactions;
    const term = globalSearchTerm.toLowerCase();
    return transactions.filter(tx => 
      tx.description.toLowerCase().includes(term) || 
      tx.impacts.some(i => 
        i.amount.toString().includes(term) || 
        (allAccounts.find(a => a.id === i.accountId)?.name || '').toLowerCase().includes(term)
      )
    );
  }, [transactions, globalSearchTerm, allAccounts]);

  const desktopVirtualizer = useVirtualizer({
    count: processedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 55,
    overscan: 10,
  });

  const desktopItems = desktopVirtualizer.getVirtualItems();
  const desktopPaddingTop = desktopItems.length > 0 ? desktopItems[0].start : 0;
  const desktopPaddingBottom = desktopItems.length > 0 ? desktopVirtualizer.getTotalSize() - desktopItems[desktopItems.length - 1].end : 0;

  const mobileVirtualizer = useWindowVirtualizer({
    count: processedTransactions.length,
    estimateSize: () => 220,
    overscan: 5,
  });

  const mobileItems = mobileVirtualizer.getVirtualItems();

  const getImpactAmount = (tx: Transaction, accountId: string) => {
    const impact = tx.impacts.find(i => i.accountId === accountId);
    if (!impact) return 0;
    if (impact.type) {
      const account = allAccounts.find(a => a.id === accountId);
      const isCredit = impact.type === 'credit';
      if (account) {
        if (account.category === 'asset' || account.category === 'expense') {
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
    <div className="xl:col-span-7">
      <div className="glass-card overflow-hidden flex flex-col h-full" style={{ borderRadius: '1.5rem' }}>
        <div className="p-4 border-b dark:border-white/10 border-slate-200 dark:bg-slate-800/20 bg-slate-100/90">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">


            <button
              onClick={() => setIsPdfScannerOpen(true)}
              className="flex items-center gap-2 h-[42px] px-3.5 text-xs font-black dark:bg-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
              title={t('importFiles')}
            >
              <FileSearch className="w-4 h-4" />
              <span>{t('scanPDF') || 'Scan PDF'}</span>
            </button>

            <button
              onClick={() => setIsDepreciationModalOpen(true)}
              className="flex items-center gap-2 h-[42px] px-3.5 text-xs font-black dark:bg-amber-500 bg-amber-500 text-white hover:bg-amber-400 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/20 uppercase tracking-widest"
              title={t('addDepreciation')}
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">{t('depreciationCalc')}</span>
            </button>

            <button
              onClick={() => setIsVatModalOpen(true)}
              className="flex items-center gap-2 h-[42px] px-3.5 text-xs font-black dark:bg-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
              title={language === 'ar' ? 'حساب ضريبة القيمة المضافة 15%' : 'Calculate 15% VAT'}
            >
              <Percent className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'الضريبة' : 'VAT'}</span>
            </button>

            {processedTransactions.length > 0 && (
              <>
              {selectedTransactions.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="group relative flex items-center gap-1.5 h-[42px] px-3.5 text-[13px] font-bold text-white bg-rose-600 border border-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('deleteSelected')} ({selectedTransactions.size})
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-black text-white bg-rose-700 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                    {t('deleteSelected')}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-rose-700"></div>
                  </div>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="relative flex items-center gap-2 h-[42px] px-3.5 dark:bg-slate-800/40 bg-white dark:hover:bg-indigo-600/50 hover:bg-indigo-50 dark:text-white text-slate-900 font-bold text-xs rounded-xl border dark:border-white/10 border-slate-300 transition-all active:scale-95 shadow-sm group"
              >
                <FileSpreadsheet className="w-4 h-4 dark:text-white text-slate-900 group-hover:text-indigo-600" />
                <span className="sr-only sm:not-sr-only">{t('exportCSV')}</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-black text-white bg-slate-900 dark:bg-slate-700 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                  {t('exportCSV')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                </div>
              </button>
              <button
                onClick={handleExportPDF}
                className="relative flex items-center gap-2 h-[42px] px-3.5 dark:bg-slate-800/40 bg-white dark:hover:bg-rose-600/50 hover:bg-rose-50 dark:text-white text-slate-900 font-bold text-xs rounded-xl border dark:border-white/10 border-slate-300 transition-all active:scale-95 shadow-sm group"
              >
                <FileText className="w-4 h-4 dark:text-white text-slate-900 group-hover:text-rose-600" />
                <span className="sr-only sm:not-sr-only">PDF</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-black text-white bg-slate-900 dark:bg-slate-700 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                  {t('exportPDF')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                </div>
              </button>
              </>
            )}
          </div>
        </div>

        <div id="transactions-table" ref={parentRef} className="hidden md:block overflow-auto flex-1 relative dark:bg-slate-800/40 bg-white">
          <table className="w-full text-[15px] text-right border-collapse">
            {processedTransactions.length > 0 && (
            <thead className="sticky top-0 z-20 dark:text-white text-slate-800 shadow-sm ring-1 dark:ring-white/10 ring-slate-200/50 bg-white dark:bg-slate-900">
              {/* Category Headers */}
              <tr className="border-b dark:border-white/10 border-slate-200 ring-1 dark:ring-white/5 ring-slate-100/50">
                <th rowSpan={hasAccounts ? 2 : 1} className="p-4 border-l dark:border-white/5 border-slate-200/50 w-10 text-center">
                  <input
                    id="select-all-transactions"
                    name="selectAll"
                    type="checkbox"
                    checked={processedTransactions.length > 0 && selectedTransactions.size === processedTransactions.length}
                    onChange={handleSelectAll}
                    className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    aria-label={t('selectAll') || 'Select All'}
                  />
                </th>
                <th rowSpan={hasAccounts ? 2 : 1} className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest w-24 text-center">{t('date')}</th>
                <th rowSpan={hasAccounts ? 2 : 1} className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest min-w-[200px]">{t('description')}</th>

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

                {incomes.length > 0 && (
                  <th colSpan={incomes.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-sky-500/10 dark:text-sky-300 text-sky-950">
                    {t('revenue')}
                  </th>
                )}

                {expenses.length > 0 && (
                  <th colSpan={expenses.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-rose-500/10 dark:text-rose-300 text-rose-950">
                    {t('expenses')}
                  </th>
                )}
                <th rowSpan={hasAccounts ? 2 : 1} className="p-3 w-10"></th>
              </tr>
              {/* Account Headers */}
              {hasAccounts && (
                <tr className="border-b dark:border-white/5 border-slate-200/30">
                {assets.map(a => (
                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-indigo-400 text-indigo-900 bg-indigo-500/5">{t(a.name)}</th>
                ))}

                {liabilities.map(a => (
                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-amber-400 text-amber-900 bg-amber-500/5">{t(a.name)}</th>
                ))}

                {equities.map(a => (
                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-emerald-400 text-emerald-900 bg-emerald-500/5">{t(a.name)}</th>
                ))}
                
                {incomes.map(a => (
                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-sky-400 text-sky-900 bg-sky-500/5">{t(a.name)}</th>
                ))}

                {expenses.map(a => (
                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-rose-400 text-rose-900 bg-rose-500/5">{t(a.name)}</th>
                ))}
              </tr>
              )}
            </thead>
            )}
            <tbody className="divide-y dark:divide-white/5 divide-slate-200/60">
              {processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={100} className="p-16 text-center bg-white/50 dark:bg-transparent">
                    <div className="flex flex-col items-center justify-center animate-fade-in">
                      <div className="relative mb-8 mt-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full animate-pulse-slow"></div>
                        <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-white/80 dark:border-white/10">
                           <FileSpreadsheet className="w-14 h-14 text-indigo-500 dark:text-indigo-400 opacity-90" />
                           <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-700 animate-float" style={{ animationDelay: '0s' }}>
                             <Calculator className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                           </div>
                           <div className="absolute -bottom-2 -left-3 w-10 h-10 bg-amber-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-700 animate-float" style={{ animationDelay: '1.5s' }}>
                             <Percent className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                           </div>
                        </div>
                      </div>
                      
                      {globalSearchTerm ? (
                        <>
                          <h3 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">{language === 'ar' ? "لم نجد أي نتائج للبحث" : "No results found"}</h3>
                          <p className="text-base font-bold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-6">{language === 'ar' ? "جرب البحث بكلمات أخرى أو قم بإلغاء البحث لرؤية جميع العمليات." : "Try different keywords or clear the search to see all transactions."}</p>
                          <button onClick={() => setGlobalSearchTerm('')} className="px-6 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-bold transition-all active:scale-95 shadow-sm">
                            {language === 'ar' ? "إلغاء البحث" : "Clear Search"}
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">{t('noTransactions')}</h3>
                          <p className="text-base font-bold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">{t('addTransactionPrompt')}</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {desktopPaddingTop > 0 && (
                    <tr><td style={{ height: `${desktopPaddingTop}px` }} colSpan={100} /></tr>
                  )}
                  {desktopItems.map((virtualRow) => {
                    const tx = processedTransactions[virtualRow.index];
                    return (
                      <TransactionTableRow
                        key={tx.id}
                        tx={tx}
                        index={virtualRow.index}
                        selectedTransactions={selectedTransactions}
                        handleSelectTransaction={handleSelectTransaction}
                        t={t}
                        setPreviewUrl={setPreviewUrl}
                        setIsDocPreviewOpen={setIsDocPreviewOpen}
                        assets={assets}
                        liabilities={liabilities}
                        equities={equities}
                        incomes={incomes}
                        expenses={expenses}
                        getImpactAmount={getImpactAmount}
                        formatCurrency={formatCurrency}
                        handleEditTransaction={handleEditTransaction}
                        handleDeleteTransaction={handleDeleteTransaction}
                      />
                    );
                  })}
                  {desktopPaddingBottom > 0 && (
                    <tr><td style={{ height: `${desktopPaddingBottom}px` }} colSpan={100} /></tr>
                  )}
                </>
              )}
            </tbody>
            {/* Totals Row */}
            {processedTransactions.length > 0 && (
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
                        {formatCurrency(totals.accounts[a.id] || 0)}
                      </td>
                    ))}

                    {incomes.map(a => (
                      <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-sky-400 text-white font-mono bg-sky-500/5" dir="ltr">
                        {formatCurrency(totals.accounts[a.id] || 0)}
                      </td>
                    ))}

                    {expenses.map(a => (
                      <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-rose-400 text-white font-mono bg-rose-500/5" dir="ltr">
                        {formatCurrency(totals.accounts[a.id] || 0)}
                      </td>
                    ))}
                    <td className="bg-slate-900/60"></td>
                  </tr>
                </tfoot>
            )}
              </table>
            </div>

            {/* Mobile Card View - Enhanced Design */}
            <div className="md:hidden flex flex-col gap-5 responsive-px py-6 bg-slate-50/50 dark:bg-slate-950/20 min-h-[300px]">
              {processedTransactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[350px]">
                  <div className="relative mb-6 mt-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse-slow"></div>
                    <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center shadow-xl border border-white/80 dark:border-white/10">
                       <FileSpreadsheet className="w-10 h-10 text-indigo-500 dark:text-indigo-400 opacity-90" />
                       <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 animate-float" style={{ animationDelay: '0s' }}>
                         <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                       </div>
                    </div>
                  </div>
                  
                  {globalSearchTerm ? (
                    <>
                      <h3 className="text-lg font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">{language === 'ar' ? "لم نجد نتائج" : "No results"}</h3>
                      <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 max-w-[250px] leading-relaxed mb-5">{language === 'ar' ? "لم نجد أي عمليات تطابق بحثك." : "We couldn't find any transactions matching your search."}</p>
                      <button onClick={() => setGlobalSearchTerm('')} className="px-5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm">
                        {language === 'ar' ? "إلغاء البحث" : "Clear Search"}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">{t('noTransactions')}</h3>
                      <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 max-w-[250px]">{t('addTransactionPrompt')}</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative', height: `${mobileVirtualizer.getTotalSize()}px` }}>
                  {mobileItems.map((virtualRow) => {
                    const tx = processedTransactions[virtualRow.index];
                    return (
                      <div 
                        key={tx.id} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="relative"
                      >
                        {/* Background Actions for Swipe */}
                        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-6 gap-3 bg-rose-50 dark:bg-slate-800 rounded-[2rem] w-full z-0 h-[calc(100%-1rem)]">
                          <button
                            onClick={() => handleEditTransaction(tx)}
                            className="p-3 dark:text-indigo-400 text-indigo-600 bg-white dark:bg-slate-700 rounded-full transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-white/10"
                            title={t('editTransaction')}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-3 dark:text-rose-400 text-rose-600 bg-white dark:bg-slate-700 rounded-full transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-white/10"
                            title={t('deleteTransaction')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -140, right: 0 }}
                          dragElastic={0.1}
                          whileTap={{ cursor: 'grabbing' }}
                          className="mobile-card !mb-0 group overflow-hidden border dark:border-white/10 border-slate-200 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-none p-5 rounded-[2rem] relative z-10 h-[calc(100%-1rem)]"
                        >
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
                                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.15em] mb-1.5" dir="ltr">{formatDate(tx.date, language === 'ar' ? 'ar-SA' : 'en-GB')}</span>
                                <p className="text-[16px] font-black dark:text-white text-slate-900 leading-snug">{tx.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 hidden md:flex">
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
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
});
