import React from 'react';
import { FileText } from 'lucide-react';
import { useLanguage } from '../i18n';
import { toast } from 'sonner';
import { Transaction } from '../types/accounting';
import { cn } from '../utils/cn';

interface IncomeStatementViewProps {
  transactions: Transaction[];
  formatCurrency: (val: number) => string;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({ transactions, formatCurrency }) => {
  const { t, dir, language } = useLanguage();

  const totalRevenue = transactions.reduce((sum, tx) => {
    return sum + tx.impacts
      .filter(i => i.accountId === 'revenue')
      .reduce((s, i) => s + i.amount, 0);
  }, 0);

  const totalExpenses = transactions.reduce((sum, tx) => {
    return sum + tx.impacts
      .filter(i => i.accountId === 'expenses')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
  }, 0);

  const netIncome = totalRevenue - totalExpenses;

  return (
    <div id="income-statement-report" className="glass-card responsive-p animate-fade-in space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" dir={dir}>
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900">{t('incomeStatement')}</h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      <div className="space-y-6">
        {/* Revenue Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('revenue')}</span>
            <span dir="ltr">{formatCurrency(totalRevenue)}</span>
          </h3>
          <div className="dark:bg-slate-900/40 bg-slate-100 rounded-2xl overflow-hidden border dark:border-white/5 border-slate-200">
            <div className="flex justify-between p-4 dark:hover:bg-white/5 hover:bg-slate-200/50 transition-colors">
              <span className="dark:text-white text-slate-900 font-medium">{t('totalRevenue')}</span>
              <span className="dark:text-white text-slate-900 font-mono font-bold" dir="ltr">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingExpenses')}</span>
            <span dir="ltr">{formatCurrency(totalExpenses)}</span>
          </h3>
          <div className="dark:bg-slate-900/40 bg-slate-100 rounded-2xl overflow-hidden border dark:border-white/5 border-slate-200">
            <div className="flex justify-between p-4 dark:hover:bg-white/5 hover:bg-slate-200/50 transition-colors">
              <span className="dark:text-white text-slate-900 font-medium">{t('totalOperatingExpenses')}</span>
              <span className="dark:text-white text-slate-900 font-mono font-bold" dir="ltr">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Net Income Section */}
        <div className="pt-6 border-t dark:border-white/20 border-slate-200">
          <div className={cn(
            "p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right",
            netIncome >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-xl sm:text-2xl font-bold uppercase tracking-tighter",
              netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {t('netIncome')}
            </span>
            <span className={cn(
              "text-2xl sm:text-3xl font-bold font-mono",
              netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )} dir="ltr">
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('income-statement-report');
            if (!element) return;
            try {
              toast.info(t('exportingPDF') || "Generating PDF...");
              const html2canvas = (await import('html2canvas')).default;
              const jsPDF = (await import('jspdf')).default;
              const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
              });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
              pdf.save(`${t('incomeStatement')}.pdf`);
              toast.success(t('exportSuccess') || "PDF generated successfully");
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error(t('errorExportingPDF'));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          {t('exportPDF')}
        </button>
      </div>
    </div>
  );
};
