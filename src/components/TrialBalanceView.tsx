import React from 'react';
import { Scale, Download } from 'lucide-react';
import { useLanguage } from '../i18n';
import { toast } from 'sonner';
import { Account } from '../types/accounting';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/date';
import { motion } from 'framer-motion';
import { BALANCE_TOLERANCE } from '../utils/constants';
import { EmptyState } from './EmptyState';

interface TrialBalanceViewProps {
  accounts: Record<string, number>;
  activeAccounts: Account[];
  formatCurrency: (val: number) => string;
}

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({ accounts, activeAccounts, formatCurrency }) => {
  const { t, dir, language } = useLanguage();

  const trialBalanceData = activeAccounts.map(account => {
    const balance = accounts[account.id] || 0;
    
    // Assets & Expenses: Positive = Debit, Negative = Credit
    // Liabilities/Equity/Income: Positive = Credit, Negative = Debit
    const isDebitAccount = account.category === 'asset' || account.category === 'expense';
    let debit = 0;
    let credit = 0;

    if (balance !== 0) {
      if (isDebitAccount) {
        if (balance > 0) debit = balance;
        else credit = Math.abs(balance);
      } else {
        if (balance > 0) credit = balance;
        else debit = Math.abs(balance);
      }
    }

    return {
      ...account,
      debit,
      credit
    };
  }).filter(a => a.debit > 0 || a.credit > 0);

  // Sort: Assets first, then Liabilities, then Equity
  trialBalanceData.sort((a, b) => {
    const order = { asset: 1, liability: 2, equity: 3 };
    return order[a.category] - order[b.category];
  });

  const totalDebits = trialBalanceData.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = trialBalanceData.reduce((sum, a) => sum + a.credit, 0);

  const isBalanced = Math.abs(totalDebits - totalCredits) < BALANCE_TOLERANCE; // Precision check

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      id="trial-balance-report" 
      className="glass-card responsive-p space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" 
      dir={dir}
    >
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900 flex items-center justify-center gap-3">
          <Scale className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {t('trialBalance')}
        </h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {formatDate(new Date(), language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      {trialBalanceData.length === 0 ? (
        <EmptyState titleKey="noTransactions" subtitleKey="addTransactionPrompt" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border dark:border-white/10 border-slate-200 bg-white/50 dark:bg-slate-900/50">
        <table className="w-full text-sm sm:text-base">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50 border-b dark:border-white/10 border-slate-200">
              <th className="px-4 py-4 font-bold text-slate-900 dark:text-white text-start w-1/2">{t('accountName')}</th>
              <th className="px-4 py-4 font-bold text-slate-900 dark:text-white text-end w-1/4">{t('debitBalance')}</th>
              <th className="px-4 py-4 font-bold text-slate-900 dark:text-white text-end w-1/4">{t('creditBalance')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5 divide-slate-200">
            {trialBalanceData.map(account => (
              <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                  {t(account.name)}
                </td>
                <td className="px-4 py-3 text-end font-mono" dir="ltr">
                  {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                </td>
                <td className="px-4 py-3 text-end font-mono" dir="ltr">
                  {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={cn(
              "font-bold text-lg border-t-2",
              isBalanced ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
            )}>
              <td className="px-4 py-5">{t('grandTotal')}</td>
              <td className="px-4 py-5 text-end font-mono" dir="ltr">{formatCurrency(totalDebits)}</td>
              <td className="px-4 py-5 text-end font-mono" dir="ltr">{formatCurrency(totalCredits)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('trial-balance-report');
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
              pdf.save(`${t('trialBalance')}.pdf`);
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
        </>
      )}
    </motion.div>
  );
};
