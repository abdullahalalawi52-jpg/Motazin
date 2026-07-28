import React, { useState } from 'react';
import { X, Percent, PlusCircle } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface VatCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (taxAccountId: string, amount: number, description: string) => void;
  accounts: { id: string, name: string, category: string }[];
}

export const VatCalculatorModal: React.FC<VatCalculatorModalProps> = ({ isOpen, onClose, onApply, accounts }) => {
  const { t, language, dir } = useLanguage();
  
  // Find a default tax account
  const defaultTaxAccount = accounts.find(a => a.name.includes('ضريب') || a.name.toLowerCase().includes('tax')) 
      || accounts.find(a => a.category === 'liability')
      || accounts[0];

  const [selectedAccount, setSelectedAccount] = useState(defaultTaxAccount?.id || '');
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(5);
  
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const taxAmount = (baseAmount * taxRate) / 100;
  const totalAmount = baseAmount + taxAmount;

  const handleApply = () => {
    if (taxAmount <= 0) return;
    const accountName = accounts.find(a => a.id === selectedAccount)?.name || '';
    const description = language === 'ar' ? `ضريبة ${taxRate}% لـ ${accountName}` : `${taxRate}% VAT for ${accountName}`;
    // Tax is usually added as a debit if it's input tax, but since this is just a quick add, we pass positive.
    onApply(selectedAccount, taxAmount, description);
    onClose();
  };

  return (
    <div data-testid="vat-modal" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-500 animate-in fade-in" dir={dir} role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white dark:bg-[#0f172a] border-t sm:border border-slate-200 dark:border-white/10 p-5 sm:p-6 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md h-fit max-h-[95vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 sm:slide-in-from-bottom-4 transition-all duration-300">
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-[-5px] mb-3 flex-none" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Percent className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
            </div>
            {language === 'ar' ? 'حاسبة الضريبة' : 'VAT Calculator'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-2 rounded-xl border border-slate-200 dark:border-white/10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{language === 'ar' ? 'حساب الضريبة' : 'Tax Account'}</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-cairo shadow-inner"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id} className="bg-white dark:bg-slate-900">{t(account.name)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{language === 'ar' ? 'المبلغ الأساسي' : 'Base Amount'}</label>
              <input
                type="number"
                value={baseAmount || ''}
                onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}</label>
              <input
                type="number"
                value={taxRate || ''}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="mt-4 p-4 sm:p-5 bg-indigo-50 dark:bg-indigo-500/[0.03] border border-indigo-100 dark:border-white/5 rounded-2xl space-y-3 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider text-xs">{language === 'ar' ? 'قيمة الضريبة' : 'Tax Amount'}:</span>
              <span className="text-slate-900 dark:text-white font-black font-mono text-base">{taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider text-xs">{language === 'ar' ? 'الإجمالي مع الضريبة' : 'Total with Tax'}:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono text-base">{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={taxAmount <= 0}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-[0.1em] text-sm group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {language === 'ar' ? 'إضافة إلى العملية' : 'Add to Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
