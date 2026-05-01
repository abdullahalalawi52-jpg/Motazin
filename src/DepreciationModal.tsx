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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={dir}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-fade-in transition-colors duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-theme-primary hover:text-indigo-600 dark:hover:text-white transition-all opacity-70 hover:opacity-100">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-theme-primary">
          <Calculator className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          {t('depreciationCalc')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold dark:text-slate-300 text-slate-800 mb-1.5 ml-1">{t('selectAssetToDepreciate')}</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-3 dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-cairo"
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id} className="dark:bg-slate-900 bg-white">{t(asset.name)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold dark:text-slate-300 text-slate-800 mb-1.5 ml-1">{t('assetCost')}</label>
              <input
                type="number"
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-3 dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold dark:text-slate-300 text-slate-800 mb-1.5 ml-1">{t('salvageValue')}</label>
              <input
                type="number"
                value={salvage || ''}
                onChange={(e) => setSalvage(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-3 dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black mb-1.5 ml-1 text-theme-muted">{t('usefulLife')}</label>
            <input
              type="number"
              value={life || ''}
              onChange={(e) => setLife(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-2xl px-4 py-3 dark:text-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="mt-6 p-5 dark:bg-indigo-500/10 bg-indigo-50/50 border border-indigo-500/20 rounded-2xl space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-sm">
              <span className="font-black text-theme-muted">{t('annualDepreciation')}:</span>
              <span className="dark:text-white text-slate-900 font-black font-mono text-base">{annualDepreciation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-black text-theme-muted">{t('monthlyDepreciation')}:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono text-base">{monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {cost > 0 && life > 0 && annualDepreciation <= 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Cost must be higher than salvage value.</span>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={annualDepreciation <= 0}
            className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            {t('applyDepreciation')}
          </button>
        </div>
      </div>
    </div>
  );
};
