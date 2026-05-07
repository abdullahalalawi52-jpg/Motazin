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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-500 animate-in fade-in" dir={dir}>
      <div className="bg-[#0f172a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 slide-in-from-bottom-4 transition-all duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-8 left-8 rtl:left-8 rtl:right-auto text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Calculator className="text-indigo-400 w-6 h-6" />
          </div>
          {t('depreciationCalc')}
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="asset-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('selectAssetToDepreciate')}</label>
            <select
              id="asset-select"
              name="assetId"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-cairo shadow-inner"
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id} className="bg-slate-900">{t(asset.name)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="asset-cost" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('assetCost')}</label>
              <input
                id="asset-cost"
                name="cost"
                type="number"
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
            <div>
              <label htmlFor="salvage-value" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('salvageValue')}</label>
              <input
                id="salvage-value"
                name="salvage"
                type="number"
                value={salvage || ''}
                onChange={(e) => setSalvage(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label htmlFor="useful-life" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('usefulLife')}</label>
            <input
              id="useful-life"
              name="usefulLife"
              type="number"
              value={life || ''}
              onChange={(e) => setLife(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
          </div>

          <div className="mt-8 p-6 bg-indigo-500/[0.03] border border-white/5 rounded-[1.5rem] space-y-4 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider">{t('annualDepreciation')}:</span>
              <span className="text-white font-black font-mono text-lg">{annualDepreciation.toLocaleString()}</span>
            </div>
            <div className="w-full h-px bg-white/5"></div>
            <div className="flex justify-between items-center text-sm relative z-10">
              <span className="font-black text-slate-500 uppercase tracking-wider">{t('monthlyDepreciation')}:</span>
              <span className="text-indigo-400 font-black font-mono text-lg">{monthlyDepreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {cost > 0 && life > 0 && annualDepreciation <= 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Cost must be higher than salvage value.</span>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={annualDepreciation <= 0}
            className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('applyDepreciation')}
          </button>
        </div>
      </div>
    </div>
  );
};
