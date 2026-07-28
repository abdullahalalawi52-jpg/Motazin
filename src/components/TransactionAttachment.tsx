import React from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n';

interface TransactionAttachmentProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export const TransactionAttachment: React.FC<TransactionAttachmentProps> = ({
  selectedFile,
  setSelectedFile,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <label htmlFor="dt-tx-file" className="block text-[11px] font-bold dark:text-slate-400 text-black uppercase tracking-widest ml-1">{t('attachDocument')}</label>
      <div className="flex items-center gap-3">
        <label htmlFor="dt-tx-file" className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-slate-900/40 border-2 border-white/5 border-dashed rounded-2xl hover:bg-slate-800/60 hover:border-indigo-500/30 cursor-pointer transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <Paperclip className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs text-slate-300 font-bold truncate max-w-[180px] relative z-10">
            {selectedFile ? selectedFile.name : t('attachDocument')}
          </span>
          <input id="dt-tx-file" name="dt-attachment" type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        </label>
        {selectedFile && (
          <button type="button" onClick={() => setSelectedFile(null)} className="p-4 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all border border-rose-500/20 group">
            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
