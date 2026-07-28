import React, { memo } from 'react';
import { XCircle, FileImage } from 'lucide-react';
import { useLanguage } from '../i18n';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface DocPreviewModalProps {
  isOpen: boolean;
  url: string | null;
  onClose: () => void;
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = memo(({ isOpen, url, onClose }) => {
  const { t, dir } = useLanguage();
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen || !url) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" 
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-modal-title"
    >
      <div ref={modalRef} className="relative bg-slate-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl border border-white/10 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/40">
          <h3 id="doc-preview-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
            <FileImage className="w-5 h-5 text-indigo-400" />
            {t('documentPreview')}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
          <img
            src={url}
            alt="Document"
            className="max-w-full h-auto rounded-lg shadow-lg border border-white/5"
            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
          />
        </div>
      </div>
    </div>
  );
});
