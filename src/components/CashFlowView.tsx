import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '../i18n';
import { toast } from 'sonner';
import { Transaction } from '../types/accounting';
import { cn } from '../utils/cn';

interface CashFlowViewProps {
  transactions: Transaction[];
  formatCurrency: (val: number) => string;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ transactions, formatCurrency }) => {
  const { t, dir, language } = useLanguage();

  const cashAccountIds = ['cash', 'bank'];

  // Categorization lists
  const investingAccounts = ['fixed_assets', 'land', 'buildings', 'equipment', 'cars', 'furniture', 'intangible_assets', 'investments'];
  const financingAccounts = ['capital', 'drawings', 'short_term_loans', 'long_term_loans', 'mortgages_payable'];

  let operatingTotal = 0;
  let investingTotal = 0;
  let financingTotal = 0;

  transactions.forEach(tx => {
    const cashImpact = tx.impacts
      .filter(i => cashAccountIds.includes(i.accountId))
      .reduce((sum, i) => sum + i.amount, 0);

    if (cashImpact === 0) return;

    const otherImpacts = tx.impacts.filter(i => !cashAccountIds.includes(i.accountId));

    let category: 'operating' | 'investing' | 'financing' = 'operating';

    if (otherImpacts.some(i => investingAccounts.includes(i.accountId))) {
      category = 'investing';
    } else if (otherImpacts.some(i => financingAccounts.includes(i.accountId))) {
      category = 'financing';
    }

    if (category === 'operating') operatingTotal += cashImpact;
    else if (category === 'investing') investingTotal += cashImpact;
    else if (category === 'financing') financingTotal += cashImpact;
  });

  const netCashFlow = operatingTotal + investingTotal + financingTotal;

  return (
    <div id="cash-flow-report" className="glass-card responsive-p animate-fade-in space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" dir={dir}>
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900">{t('cashFlowStatement')}</h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingActivities')}</span>
            <span dir="ltr" className={operatingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(operatingTotal)}
            </span>
          </h3>
        </div>

        {/* Investing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex justify-between">
            <span>{t('investingActivities')}</span>
            <span dir="ltr" className={investingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(investingTotal)}
            </span>
          </h3>
        </div>

        {/* Financing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex justify-between">
            <span>{t('financingActivities')}</span>
            <span dir="ltr" className={financingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(financingTotal)}
            </span>
          </h3>
        </div>

        {/* Total Net Cash Flow */}
        <div className="pt-6 border-t dark:border-white/20 border-slate-200">
          <div className={cn(
            "p-6 rounded-3xl flex justify-between items-center",
            netCashFlow >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-2xl font-bold uppercase tracking-tighter",
              netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {t('netCashFlow')}
            </span>
            <div className="text-right">
              <div className={cn(
                "text-3xl font-bold font-mono",
                netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )} dir="ltr">
                {formatCurrency(netCashFlow)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {netCashFlow >= 0 ? t('increaseInCash') : t('decreaseInCash')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('cash-flow-report');
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
              pdf.save(`${t('cashFlowStatement')}.pdf`);
              toast.success(t('exportSuccess') || "PDF generated successfully");
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error(t('errorExportingPDF'));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
        >
          <ArrowRightLeft className="w-5 h-5" />
          {t('exportPDF')}
        </button>
      </div>
    </div>
  );
};
