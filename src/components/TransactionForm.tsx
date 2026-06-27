import React from 'react';
import { Plus, Trash2, Paperclip, Edit2, Save, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../i18n';
import { Account, Category, Impact } from '../types/accounting';
import { cn } from '../utils/cn';

interface TransactionFormProps {
  editingTransactionId: string | null;
  date: string;
  setDate: (date: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isRecurring: boolean;
  setIsRecurring: (val: boolean) => void;
  recurrenceInterval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setRecurrenceInterval: (val: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  impacts: Omit<Impact, 'id'>[];
  handleAddImpact: () => void;
  handleRemoveImpact: (index: number) => void;
  handleImpactChange: (index: number, field: keyof Omit<Impact, 'id'>, value: string | number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancelEdit: () => void;
  isUploading: boolean;
  allAccounts: Account[];
  currency: string;
  setCustomAccountModalIdx: (idx: number | null) => void;
  setNewCustomAccountName: (name: string) => void;
  setNewCustomAccountCategory: (category: Category) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  modalScrollRef?: React.RefObject<HTMLDivElement>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  editingTransactionId,
  date,
  setDate,
  description,
  setDescription,
  selectedFile,
  setSelectedFile,
  isRecurring,
  setIsRecurring,
  recurrenceInterval,
  setRecurrenceInterval,
  impacts,
  handleAddImpact,
  handleRemoveImpact,
  handleImpactChange,
  handleSubmit,
  handleCancelEdit,
  isUploading,
  allAccounts,
  currency,
  setCustomAccountModalIdx,
  setNewCustomAccountName,
  setNewCustomAccountCategory,
  isModal = false,
  onCloseModal,
  modalScrollRef
}) => {
  const { t, language, dir } = useLanguage();

  const renderAccountOptions = () => (
    <>
      <option value="NEW_CUSTOM_ACCOUNT" className="dark:text-indigo-400 text-indigo-600 font-extrabold text-sm">
        {language === 'ar' ? '+ إضافة حساب جديد...' : '+ Add Custom Account...'}
      </option>
      <optgroup label={t('assets')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-indigo-400">
        {allAccounts.filter(a => a.category === 'asset').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
      <optgroup label={t('liabilities')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-amber-400">
        {allAccounts.filter(a => a.category === 'liability').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
      <optgroup label={t('equity')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-emerald-400">
        {allAccounts.filter(a => a.category === 'equity').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
    </>
  );

  const innerFormContent = () => (
    <>
      {/* Date & Description Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1">
          <label htmlFor={isModal ? "mob-tx-date" : "dt-tx-date"} className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('date')}</label>
          <input
            id={isModal ? "mob-tx-date" : "dt-tx-date"}
            name={isModal ? "mob-date" : "dt-date"}
            type="text"
            value={date}
            onChange={e => setDate(e.target.value)}
            placeholder={t('exampleDate')}
            className={cn(
              "w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none",
              isModal && "py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            )}
          />
        </div>
        <div className="col-span-2">
          <label htmlFor={isModal ? "mob-tx-description" : "dt-tx-desc"} className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('description')}</label>
          <input
            id={isModal ? "mob-tx-description" : "dt-tx-desc"}
            name={isModal ? "mob-description" : "dt-description"}
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('exampleDesc')}
            className={cn(
              "w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none",
              isModal && "py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            )}
          />
        </div>
      </div>

      {/* Document Attachment Section (Only for inline form; modal file upload uses same logic) */}
      {!isModal && (
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
      )}

      {/* Recurring Transaction Logic */}
      <div className="flex flex-wrap items-center gap-4 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
        <label htmlFor={isModal ? "mob-tx-recurring" : "dt-tx-recurring"} className="flex items-center gap-3 cursor-pointer group">
          <input
            id={isModal ? "mob-tx-recurring" : "dt-tx-recurring"}
            name={isModal ? "mob-isRecurring" : "dt-isRecurring"}
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className={cn(
              "w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer",
              isModal && "w-6 h-6 border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900"
            )}
          />
          <span className={cn("text-sm font-bold dark:text-white text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors uppercase tracking-tight", isModal && "font-black")}>{t('recurringTransaction')}</span>
        </label>

        {isRecurring && (
          <div className={cn(
            "flex items-center gap-3 animate-fade-in pl-2 border-l border-white/10",
            isModal && "pt-3 border-t border-l-0 border-indigo-500/10 w-full"
          )}>
            <label htmlFor={isModal ? "mob-tx-recurrence-interval" : "dt-tx-recurrence-interval"} className={cn("text-[10px] font-bold dark:text-slate-400 text-black uppercase tracking-widest", isModal && "font-black text-slate-500")}>{t('repeatsEveryLabel')}</label>
            <select
              id={isModal ? "mob-tx-recurrence-interval" : "dt-tx-recurrence-interval"}
              name={isModal ? "mob-recurrenceInterval" : "dt-recurrenceInterval"}
              value={recurrenceInterval}
              onChange={(e) => setRecurrenceInterval(e.target.value as any)}
              className={cn(
                "px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white text-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                isModal && "flex-1 py-2.5 font-black"
              )}
            >
              <option value="daily">{t('day')}</option>
              <option value="weekly">{t('week')}</option>
              <option value="monthly">{t('month')}</option>
              <option value="yearly">{t('year')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Account Impacts Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className={cn("text-[11px] font-bold uppercase tracking-widest ml-1 text-theme-muted", isModal && "text-[10px] font-black text-slate-500")}>{t('impactOnAccounts')}</span>
          <button
            type="button"
            onClick={handleAddImpact}
            className={cn(
              "touch-target text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-2 transition-all bg-indigo-500/10 hover:bg-indigo-500 px-4 py-2.5 rounded-xl border border-indigo-500/20 uppercase tracking-tighter",
              isModal && "text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 tracking-widest font-black"
            )}
          >
            <Plus className={cn("w-4 h-4", isModal && "w-3.5 h-3.5")} /> {t('addAccount')}
          </button>
        </div>

        <div className="space-y-4">
          {impacts.map((impact, idx) => (
            <div key={idx} className={cn(
              "glass-card p-4 sm:p-5 relative border-l-4 border-indigo-500 group transition-all hover:scale-[1.01] hover:shadow-indigo-500/10 overflow-hidden",
              isModal && "p-4 shadow-sm hover:shadow-md border-l-4"
            )}>
              {/* Delete Impact Button */}
              <button
                type="button"
                onClick={() => handleRemoveImpact(idx)}
                disabled={impacts.length <= 2}
                className={cn(
                  "absolute p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10",
                  isModal ? "top-2 left-2 p-2 rounded-xl disabled:pointer-events-none" : (dir === 'rtl' ? 'left-4 top-2' : 'right-4 top-2')
                )}
                title={t('delete') || 'Delete'}
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className={cn("flex flex-col gap-4", isModal && "grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pl-8 sm:pl-0")}>
                {/* Account Picker */}
                <div className={cn("space-y-2", isModal && "col-span-1 sm:col-span-5 space-y-1.5")}>
                  <label htmlFor={isModal ? `mob-tx-account-${idx}` : `dt-account-id-${idx}`} className={cn("text-[9px] uppercase font-bold tracking-widest block ml-1 text-theme-muted", isModal && "font-black text-slate-500")}>{t('accountName')}</label>
                  <select
                    id={isModal ? `mob-tx-account-${idx}` : `dt-account-id-${idx}`}
                    name={isModal ? `mob-accountId-${idx}` : `dt-accountId-${idx}`}
                    value={impact.accountId}
                    onChange={e => {
                      if (e.target.value === 'NEW_CUSTOM_ACCOUNT') {
                        setCustomAccountModalIdx(idx);
                        setNewCustomAccountName('');
                        setNewCustomAccountCategory('asset');
                      } else {
                        handleImpactChange(idx, 'accountId', e.target.value);
                      }
                    }}
                    className={cn(
                      "w-full px-4 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-950/60 bg-white dark:text-white text-slate-900 font-bold cursor-pointer transition-colors",
                      isModal && "py-2.5 rounded-xl text-xs shadow-inner appearance-none focus:border-indigo-500/50"
                    )}
                  >
                    {renderAccountOptions()}
                  </select>
                </div>

                {/* Value Input Area / Debit-Credit Control */}
                <div className={cn("space-y-2", isModal && "col-span-1 sm:col-span-4 space-y-1.5")}>
                  {!isModal && <label htmlFor={`dt-amount-input-${idx}`} className="text-[9px] uppercase font-bold tracking-widest block ml-1 text-theme-muted">{t('impactValue')}</label>}
                  {isModal && <label className="text-[9px] font-black uppercase tracking-widest block ml-1 dark:text-slate-400 text-slate-500">{t('impactValue')}</label>}
                  {(() => {
                    const amount = typeof impact.amount === 'number' ? impact.amount : 0;
                    const account = allAccounts.find(a => a.id === impact.accountId);
                    const isNeg = amount < 0 || Object.is(amount, -0);
                    const isCredit = impact.type
                      ? impact.type === 'credit'
                      : (account
                        ? (account.category === 'asset' ? isNeg : !isNeg)
                        : isNeg);
                    return (
                      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", isModal && "flex dark:bg-slate-950 bg-slate-100 p-0.5 rounded-xl border dark:border-white/10 border-slate-200 shadow-inner w-full")}>
                        {/* Segmented Debit/Credit Control */}
                        <div className={cn("flex dark:bg-slate-950 bg-slate-100 p-1 rounded-2xl border dark:border-white/5 border-slate-200 w-full shadow-inner", isModal && "contents")}>
                          <button
                            type="button"
                            onClick={() => {
                              handleImpactChange(idx, 'type', 'debit');
                            }}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                              !isCredit ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]" : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600",
                              isModal && (!isCredit ? "bg-emerald-500 text-white shadow-sm py-2 rounded-lg text-[9px] font-black" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2 rounded-lg text-[9px] font-black")
                            )}
                          >
                            {t('debit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleImpactChange(idx, 'type', 'credit');
                            }}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                              isCredit ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-[1.02]" : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600",
                              isModal && (isCredit ? "bg-rose-500 text-white shadow-sm py-2 rounded-lg text-[9px] font-black" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2 rounded-lg text-[9px] font-black")
                            )}
                          >
                            {t('credit')}
                          </button>
                        </div>

                        {!isModal && (
                          <div className="relative group/input">
                            <input
                              id={`dt-amount-input-${idx}`}
                              name={`dt-amount-${idx}`}
                              type="number"
                              step="any"
                              value={amount !== 0 ? amount : ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                handleImpactChange(idx, 'amount', val);
                              }}
                              placeholder="0.00"
                              className={cn(
                                "w-full pl-4 pr-12 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono transition-all dark:bg-slate-950/80 bg-white shadow-lg",
                                isCredit ? "dark:text-rose-400 text-rose-600 focus:border-rose-500/50" : "dark:text-emerald-400 text-emerald-600 focus:border-emerald-500/50"
                              )}
                              dir="ltr"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold pointer-events-none dark:opacity-50 opacity-40">
                              {currency}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {isModal && (
                  <div className="col-span-1 sm:col-span-3 space-y-1.5">
                    {(() => {
                      const amount = typeof impact.amount === 'number' ? impact.amount : 0;
                      const account = allAccounts.find(a => a.id === impact.accountId);
                      const isNeg = amount < 0 || Object.is(amount, -0);
                      const isCredit = impact.type
                        ? impact.type === 'credit'
                        : (account
                          ? (account.category === 'asset' ? isNeg : !isNeg)
                          : isNeg);
                      return (
                        <div className="relative">
                          <input
                            id={`mob-tx-amount-${idx}`}
                            name={`mob-amount-${idx}`}
                            type="number"
                            step="any"
                            value={amount !== 0 ? amount : ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              handleImpactChange(idx, 'amount', val);
                            }}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 dark:bg-slate-950 bg-white border dark:border-white/10 border-slate-200 rounded-xl text-sm font-mono text-right font-bold transition-all outline-none focus:border-indigo-500/50",
                              isCredit ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                            )}
                            placeholder="0.00"
                            dir="ltr"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black dark:text-white/30 text-slate-400 pointer-events-none uppercase tracking-widest">
                            {currency}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={dir}>
        <div
          className="absolute inset-0"
          onClick={onCloseModal}
        />
        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative w-full max-w-2xl bg-white dark:bg-slate-900 border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col transition-all",
            "rounded-t-[2.5rem] md:rounded-[2rem] h-fit max-h-[92vh] md:max-h-[85vh] overflow-hidden",
            "animate-in slide-in-from-bottom duration-500 md:zoom-in-95"
          )}
        >
          {/* Handle for bottom sheet */}
          <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-none" />

          <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200 flex-none bg-white dark:bg-slate-900 z-10">
            <div>
              <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                {editingTransactionId ? t('editTransaction') : t('addNewTransaction')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCloseModal}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={modalScrollRef}
            className="p-6 overflow-y-auto custom-scrollbar no-scrollbar flex-1 max-h-[calc(92vh-180px)] md:max-h-[calc(85vh-180px)] space-y-6 pb-6 bg-slate-50/50 dark:bg-slate-950/20"
          >
            {innerFormContent()}
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-white/10 border-slate-200 flex gap-4 flex-none z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {isUploading ? t('uploading') : (editingTransactionId ? t('saveChanges') : t('addTransaction'))}
            </button>
            <button
              type="button"
              onClick={onCloseModal}
              className="px-8 bg-slate-100 dark:bg-slate-800 active:scale-95 text-slate-600 dark:text-white font-black py-4 rounded-2xl transition-all border dark:border-white/10 border-slate-200 uppercase tracking-widest text-[10px]"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Desktop sidebar rendering
  return (
    <div className="glass-card p-6 border-t-4 border-indigo-500 shadow-2xl">
      <h2 className="text-xl font-bold text-theme-primary mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-xl">
          {editingTransactionId ? (
            <Edit2 className="w-5 h-5 text-indigo-400" />
          ) : (
            <Plus className="w-5 h-5 text-indigo-400" />
          )}
        </div>
        {editingTransactionId ? t('editTransaction') : t('addNewTransaction')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {innerFormContent()}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isUploading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            {isUploading ? (
              <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> {t('uploading')}</>
            ) : (
              <>
                {editingTransactionId ? <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                <span className="uppercase tracking-widest">{editingTransactionId ? t('saveChanges') : t('addTransaction')}</span>
              </>
            )}
          </button>
          {editingTransactionId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-8 bg-slate-200 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 dark:text-white text-slate-700 font-bold py-4 rounded-2xl transition-all border border-slate-300 dark:border-white/10 uppercase tracking-widest text-xs"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
