import React, { useState } from 'react';
import { X, Calculator, PlusCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from './i18n';

interface DepreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (accountId: string, amount: number, description: string) => void;
  assets: { id: string, name: string }[];
}

export const DepreciationModal: React.FC<DepreciationModalProps> = ({ isOpen, onClose, onApply, assets }) => {
  const { t, dir } = useLanguage();
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || '');
  const [cost, setCost] = useState<number>(0);
  const [salvage, setSalvage] = useState<number>(0);
  const [life, setLife] = useState<number>(1);

  if (!isOpen) return null;

  const annualDepreciation = (cost - salvage) / (life || 1);
  const monthlyDepreciation = annualDepreciation / 12;

  const handleApply = () => {
    if (cost <= 0 || life <= 0) return;
    const assetName = assets.find(a => a.id === selectedAsset)?.name || '';
    const description = `${t('depreciationFor')} ${t(assetName)}`;
    // Depreciation is a reduction of the asset value, so it's negative.
    onApply(selectedAsset, -annualDepreciation, description);
    onClose();
  };

  return (
    <div data-testid="depreciation-modal" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-500 animate-in fade-in" dir={dir}>
      <div className="bg-white dark:bg-[#0f172a] border-t sm:border border-slate-200 dark:border-white/10 p-5 sm:p-6 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-md h-fit max-h-[95vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 sm:slide-in-from-bottom-4 transition-all duration-300">
        {/* Handle for mobile bottom sheet */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-[-5px] mb-3 flex-none" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Calculator className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
            </div>
            {t('depreciationCalc')}
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
            <label htmlFor="asset-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('selectAssetToDepreciate')}</label>
            <select
              id="asset-select"
              name="assetId"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-cairo shadow-inner"
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id} className="bg-white dark:bg-slate-900">{t(asset.name)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="asset-cost" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('assetCost')}</label>
              <input
                id="asset-cost"
                name="cost"
                type="number"
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
            <div>
              <label htmlFor="salvage-value" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('salvageValue')}</label>
              <input
                id="salvage-value"
                name="salvage"
                type="number"
                value={salvage || ''}
                onChange={(e) => setSalvage(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label htmlFor="useful-life" className="block text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('usefulLife')}</label>
            <input
              id="useful-life"
              name="usefulLife"
              type="number"
              value={life || ''}
              onChange={(e) => setLife(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner text-sm sm:text-base"
            />
          </div>

          <div className="mt-4 p-4 sm:p-5 bg-indigo-50 dark:bg-indigo-500/[0.03] border border-indigo-100 dark:border-white/5 rounded-2xl space-y-3 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider text-xs">{t('annualDepreciation')}:</span>
              <span className="text-slate-900 dark:text-white font-black font-mono text-base">{annualDepreciation.toLocaleString()}</span>
            </div>
            <div className="w-full h-px bg-slate-200 dark:bg-white/5"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider text-xs">{t('monthlyDepreciation')}:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono text-base">{monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {cost > 0 && life > 0 && annualDepreciation <= 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Cost must be higher than salvage value.</span>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={annualDepreciation <= 0}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 uppercase tracking-[0.1em] text-sm group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('applyDepreciation')}
          </button>
        </div>
      </div>
    </div>
  );
};
