import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Trash2, Download } from 'lucide-react';
import { useLanguage } from './i18n';
import { useTheme } from './ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface Snapshot {
  id: string;
  name: string;
  date: string;
  transactions: any[];
  budgets: Record<string, number>;
}

interface SnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTransactions: any[];
  currentBudgets: Record<string, number>;
  onLoadSnapshot: (transactions: any[], budgets: Record<string, number>) => void;
}

export function SnapshotsModal({ isOpen, onClose, currentTransactions, currentBudgets, onLoadSnapshot }: SnapshotsModalProps) {
  const { t, dir, language } = useLanguage();
  const { theme } = useTheme();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('motazin_snapshots');
      if (saved) {
        try {
          setSnapshots(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing snapshots", e);
        }
      }
    }
  }, [isOpen]);

  const saveSnapshots = (newSnapshots: Snapshot[]) => {
    setSnapshots(newSnapshots);
    localStorage.setItem('motazin_snapshots', JSON.stringify(newSnapshots));
  };

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;

    const newSnapshot: Snapshot = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSnapshotName,
      date: new Date().toISOString(),
      transactions: currentTransactions,
      budgets: currentBudgets
    };

    saveSnapshots([newSnapshot, ...snapshots]);
    setNewSnapshotName('');
  };

  const handleDeleteSnapshot = (id: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟' : 'Are you sure you want to delete this backup?')) {
      saveSnapshots(snapshots.filter(s => s.id !== id));
    }
  };

  const handleLoadSnapshot = (snapshot: Snapshot) => {
    if (confirm(language === 'ar' ? 'تحذير: سيتم مسح البيانات الحالية واستبدالها بهذه النسخة. هل تريد الاستمرار؟' : 'Warning: Current data will be replaced by this backup. Continue?')) {
      onLoadSnapshot(snapshot.transactions, snapshot.budgets);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-500 animate-in fade-in" dir={dir}>
      <div 
        className={cn(
          "w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        )}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center relative">
           <button 
            onClick={onClose} 
            className="absolute top-8 left-8 rtl:left-8 rtl:right-auto text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mr-2 rtl:mr-0 rtl:ml-2 ml-auto rtl:flex-row-reverse">
            <div className="text-right rtl:text-left">
              <h2 className="text-2xl font-black text-white">
                {language === 'ar' ? 'سجل النسخ الاحتياطية' : 'Backups History'}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage and restore your data</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Clock className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSaveSnapshot} className="flex flex-col gap-4 mb-10 group">
            <div className="flex flex-col gap-2">
              <label htmlFor="snapshot-name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {language === 'ar' ? 'اسم النسخة الاحتياطية' : 'Backup Name'}
              </label>
              <div className="flex gap-3">
                <input 
                  id="snapshot-name"
                  name="snapshotName"
                  type="text" 
                  required
                  value={newSnapshotName}
                  onChange={e => setNewSnapshotName(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم النسخة (مثال: حسابات شهر مارس 2024)' : 'Backup name (e.g. March 2024)'}
                  className="flex-1 px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.02] text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all shadow-inner placeholder:text-slate-600 font-bold"
                />
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 whitespace-nowrap uppercase tracking-widest text-xs"
                >
                  <Save className="w-5 h-5" />
                  {language === 'ar' ? 'حفظ نسخة' : 'Save'}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-4 mb-6">
              {language === 'ar' ? 'النسخ المحفوظة' : 'Saved Backups'}
            </h3>
            
            {snapshots.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                <Clock className="w-16 h-16 mx-auto mb-4 text-slate-700 opacity-20" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{language === 'ar' ? 'لا توجد نسخ محفوظة حالياً.' : 'No saved backups yet.'}</p>
              </div>
            ) : (
              snapshots.map(snapshot => (
                <div key={snapshot.id} className="group flex items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
                  {/* Subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <h4 className="font-black text-lg text-white mb-2 group-hover:text-indigo-300 transition-colors">{snapshot.name}</h4>
                    <div className="flex items-center gap-3">
                       <p className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-500 uppercase tracking-tighter" dir="ltr">
                        {new Date(snapshot.date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        {snapshot.transactions.length} {language === 'ar' ? 'عملية' : 'transactions'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10">
                    <button
                      onClick={() => handleLoadSnapshot(snapshot)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-black rounded-xl border border-emerald-500/20 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/5"
                    >
                      <Download className="w-4 h-4" />
                      <span>{language === 'ar' ? 'استعادة' : 'Load'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
