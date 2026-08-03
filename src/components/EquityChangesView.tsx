import React from 'react';
import { LineChart, Download } from 'lucide-react';
import { useLanguage } from '../i18n';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/date';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';

import { calculateTotals } from '../utils/accounting';

interface EquityChangesViewProps {
  totals: ReturnType<typeof calculateTotals>;
  formatCurrency: (val: number) => string;
}

export const EquityChangesView: React.FC<EquityChangesViewProps> = ({ totals, formatCurrency }) => {
  const { t, dir, language } = useLanguage();

  const accounts = totals.accounts;

  // We should ideally sum all accounts of category 'equity' except drawings.
  // But since we don't have allAccounts here easily, let's just use the main ones.
  const capital = accounts['capital'] || 0;
  const shareCapital = accounts['share_capital'] || 0;
  const retainedEarnings = accounts['retained_earnings'] || 0;
  const totalBeginningCapital = capital + shareCapital + retainedEarnings;

  const revenue = totals.totalIncome || 0;
  // Expenses are normally negative in totals, so we use Math.abs
  const expenses = Math.abs(totals.totalExpense || 0);
  const netIncome = revenue - expenses;

  // Drawings are normally negative in totals (reduces equity), we take absolute value to subtract it visually
  const drawings = Math.abs(accounts['drawings'] || 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      id="equity-changes-report" 
      className="glass-card responsive-p space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" 
      dir={dir}
    >
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900 flex items-center justify-center gap-3">
          <LineChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {t('statementOfChangesInEquity')}
        </h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {formatDate(new Date(), language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      {(totalBeginningCapital === 0 && netIncome === 0 && drawings === 0) ? (
        <EmptyState titleKey="noTransactions" subtitleKey="addTransactionPrompt" />
      ) : (
      <div className="space-y-4">
        {/* Beginning Capital */}
        <div className="dark:bg-slate-900/40 bg-slate-100 rounded-2xl overflow-hidden border dark:border-white/5 border-slate-200">
          <div className="flex justify-between p-4 dark:hover:bg-white/5 hover:bg-slate-200/50 transition-colors">
            <span className="dark:text-white text-slate-900 font-medium text-lg">{t('beginningBalance')} ({t('capital')})</span>
            <span className="dark:text-white text-slate-900 font-mono font-bold text-lg" dir="ltr">{formatCurrency(totalBeginningCapital)}</span>
          </div>
        </div>

        {/* Net Income */}
        <div className="pl-4 pr-4 space-y-2">
          <div className="flex justify-between items-center text-sm sm:text-base border-b dark:border-white/10 border-slate-200 pb-2">
            <span className="text-slate-600 dark:text-slate-400">{t('netIncomeForPeriod')}</span>
            <span className={cn("font-mono font-bold", netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} dir="ltr">
              {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
            </span>
          </div>
        </div>

        {/* Drawings */}
        {drawings > 0 && (
          <div className="pl-4 pr-4 space-y-2">
            <div className="flex justify-between items-center text-sm sm:text-base border-b dark:border-white/10 border-slate-200 pb-2">
              <span className="text-slate-600 dark:text-slate-400">{t('lessDrawings')}</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono font-bold" dir="ltr">
                -{formatCurrency(drawings)}
              </span>
            </div>
          </div>
        )}

        {/* Ending Capital */}
        <div className="pt-4 mt-4 border-t dark:border-white/20 border-slate-200">
          <div className="p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-start bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-xl sm:text-2xl font-bold uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">
              {t('endingBalance')} ({t('equity')})
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400" dir="ltr">
              {formatCurrency(totals.totalEquity)}
            </span>
          </div>
        </div>
      </div>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('equity-changes-report');
            if (!element) return;
            try {
              toast.info(t('exportingPDF') || "Generating PDF...");
              const html2canvas = (await import('html2canvas')).default;
              const { jsPDF } = await import('jspdf');
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
              });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
              pdf.save(`${t('equityChanges')}.pdf`);
              toast.success(t('exportSuccess') || "PDF generated successfully");
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error(t('errorExportingPDF'));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          {t('exportPDF')}
        </button>
      </div>
    </motion.div>
  );
};
