import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: string;
  cancelText: string;
  dir?: 'ltr' | 'rtl';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = React.memo(({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  dir = 'rtl'
}) => {
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in" 
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div 
        ref={modalRef}
        className={cn(
          "w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-center gap-4 mb-4 rtl:flex-row-reverse">
          <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-start">
            <h3 id="confirmation-modal-title" className="text-xl font-black text-white">{title}</h3>
          </div>
        </div>
        
        <p className="text-slate-300 text-sm mb-6 leading-relaxed text-start">{message}</p>
        
        <div className="flex gap-3 justify-end rtl:flex-row-reverse">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});
