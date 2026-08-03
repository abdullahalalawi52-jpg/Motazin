import React from 'react';
import { UploadCloud, CheckCircle2, FileText, X, AlertCircle, Image, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../i18n';
import { ParsedRow } from '../../types/accounting';
import { useFileScanner } from '../../hooks/useFileScanner';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface FileScannerProps {
  geminiApiKey?: string;
  onImport: (rows: ParsedRow[]) => void;
  onClose: () => void;
}

export const FileScanner: React.FC<FileScannerProps> = ({ geminiApiKey, onImport, onClose }) => {
  const { t, dir, language } = useLanguage();
  const modalRef = useFocusTrap(true);
  
  const {
    isProcessing,
    progress,
    status,
    parsedRows,
    setParsedRows,
    rawText,
    showRawText,
    toggleRawText,
    ocrLanguage,
    setOcrLanguage,
    error,
    fileInputRef,
    processFile,
    handleFileDrop,
    handleToggleRow,
    handleUpdateRow,
    handleAddManualRow,
    handleImport
  } = useFileScanner(geminiApiKey, onImport, onClose);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-12 lg:p-20 bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm transition-all duration-700 animate-in fade-in" 
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-scanner-title"
    >
      <div 
        ref={modalRef}
        className="bg-white/95 dark:bg-[#0f172a]/95 border-t sm:border border-slate-200 dark:border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl dark:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] relative transition-all duration-500 animate-in slide-in-from-bottom sm:zoom-in-95 fade-in"
      >
        
        {/* Decorative subtle top light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm"></div>

        {/* Header Section */}
        <div className="p-6 sm:p-10 pb-4 sm:pb-6 relative flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="pdf-scanner-title" className="text-xl sm:text-3xl font-black flex items-center gap-3 sm:gap-4 text-slate-900 dark:text-white">
              <div className="p-2 sm:p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <UploadCloud className="text-indigo-600 dark:text-indigo-400 w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              {language === 'ar' ? 'استيراد ملفات/صور' : 'Import Files / Images'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base font-medium max-w-xl leading-relaxed mt-1 sm:mt-2 opacity-80">
              {language === 'ar' 
                ? 'استخرج المعاملات المالية بذكاء من PDF، Word، Excel، أو حتى الصور الملتقطة.' 
                : 'Intelligently extract financial transactions from PDF, Word, Excel, or captured photos.'}
            </p>
          </div>

          <button 
            onClick={onClose} 
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:scale-110 active:scale-95 shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {parsedRows.length === 0 && !isProcessing && (
          <div className="px-6 sm:px-10 pb-6 sm:pb-10 flex flex-col flex-1 overflow-hidden">
            {/* Language Selector Pill */}
            <div className="flex items-center justify-center mb-6 sm:mb-10">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 sm:p-2 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shadow-2xl w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/10 rtl:sm:border-r-0 rtl:sm:border-l w-full sm:w-auto justify-center sm:justify-start">
                   <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                   <span className="text-[9px] sm:text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                     {language === 'ar' ? 'لغة التعرف' : 'OCR Language'}
                   </span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 pr-0 sm:pr-2 rtl:sm:pr-0 rtl:sm:pl-2">
                  {(['ara+eng', 'ara', 'eng'] as const).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setOcrLanguage(lang)}
                      className={cn(
                        "px-4 sm:px-6 py-2 sm:py-2.5 rounded-[1.5rem] text-[9px] sm:text-[11px] font-black transition-all uppercase tracking-widest",
                        ocrLanguage === lang 
                          ? "bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.4)] scale-105" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-amber-400/80 font-bold px-4">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Tip: Use <b>ENG</b> for purely English docs</span>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <label 
              htmlFor="file-upload-input"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex-1 min-h-[250px] sm:min-h-[380px] border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-500/50 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.05] transition-all duration-500 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center cursor-pointer p-6 sm:p-12 group relative overflow-hidden shadow-inner"
            >
              <input 
                id="file-upload-input"
                name="document"
                type="file" 
                accept=".pdf, .docx, .xlsx, .xls, .pptx, .png, .jpg, .jpeg, .webp" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              
              <div className="flex gap-4 sm:gap-8 mb-6 sm:mb-12 relative z-10">
                {[
                  { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                  { icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { icon: Image, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-500 shadow-xl group-hover:scale-110 group-hover:-translate-y-2",
                    item.bg, item.border
                  )}>
                    <item.icon className={cn("w-6 h-6 sm:w-10 sm:h-10", item.color)} />
                  </div>
                ))}
              </div>

              <div className="text-center space-y-2 sm:space-y-4 relative z-10">
                <h3 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight px-4">
                  {language === 'ar' ? 'انقر هنا للرفع أو اسحب الملف هنا' : 'Click to upload or drag files here'}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">
                  PDF, Word, Excel, PPTX, PNG, JPG (Max 10MB)
                </p>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/[0.03] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Corner Accents */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-slate-200 dark:border-white/5 rounded-tl-xl group-hover:border-indigo-500/30 transition-colors"></div>
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-slate-200 dark:border-white/5 rounded-br-xl group-hover:border-indigo-500/30 transition-colors"></div>
            </label>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-8 p-12">
            <div className="relative w-32 h-32">
               <div className="absolute inset-0 border-[6px] border-slate-200 dark:border-white/5 rounded-full"></div>
               <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
            </div>
            <div className="text-center space-y-4">
               <p className="font-black text-2xl uppercase tracking-[0.3em] text-slate-900 dark:text-white animate-pulse">{status}</p>
               <div className="w-80 h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mx-auto border border-slate-300 dark:border-white/5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="text-indigo-600 dark:text-indigo-400 text-sm font-black tracking-widest">{progress}%</p>
            </div>
          </div>
        )}

        {error && !isProcessing && (
          <div className="mx-8 mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 shadow-2xl shadow-rose-500/5 animate-in slide-in-from-top-2">
            <AlertCircle className="w-7 h-7 flex-shrink-0" />
            <p className="text-sm font-black leading-relaxed">{error}</p>
          </div>
        )}

        {parsedRows.length > 0 && !isProcessing && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-10 pb-4 sm:pb-10">
            <div className="flex-1 overflow-auto rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 mb-4 sm:mb-6 custom-scrollbar shadow-inner relative">
              <table className="w-full text-start text-sm">
                <thead className="text-[10px] uppercase bg-white/90 dark:bg-slate-900/90 text-slate-500 sticky top-0 backdrop-blur-xl z-10 font-black tracking-[0.15em] border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-5">
                      <input 
                        id="select-all-parsed"
                        name="selectAllParsed"
                        type="checkbox" 
                        checked={parsedRows.every(r => r.selected)}
                        onChange={(e) => setParsedRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                        className="rounded-lg border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-indigo-500 focus:ring-indigo-500/30 w-5 h-5 cursor-pointer transition-all appearance-none checked:bg-indigo-500 relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCA2TDkgMTdsLTUtNSIvPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:14px_14px] before:opacity-0 checked:before:opacity-100"
                        aria-label="Select all parsed rows"
                      />
                    </th>
                    <th className="px-6 py-5">{t('date')}</th>
                    <th className="px-6 py-5">{t('description')}</th>
                    <th className="px-6 py-5">{t('account') || 'Account'}</th>
                    <th className="px-6 py-5 text-end">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {parsedRows.map((row, idx) => {
                    const d = row.description.toLowerCase();
                    const isTotal = /\btotal\b|إجمالي|مجموع|صافي|net\b|liabilities.*equity|shareholders.*funds/i.test(d);
                    
                    return (
                    <tr key={row.id} className={cn(
                      "hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all group",
                      isTotal && "bg-indigo-50 dark:bg-indigo-500/[0.03]"
                    )}>
                      <td className="px-6 py-4">
                        <input 
                          id={`select-row-${idx}`}
                          name={`selectRow-${idx}`}
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => handleToggleRow(row.id)}
                          className={cn(
                            "rounded-lg border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-indigo-500 focus:ring-indigo-500/30 w-5 h-5 cursor-pointer transition-all appearance-none checked:bg-indigo-500 relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCA2TDkgMTdsLTUtNSIvPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:14px_14px] before:opacity-0 checked:before:opacity-100",
                            isTotal && "opacity-40"
                          )}
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {isTotal && <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mr-2">Total</span>}
                        <input 
                          id={`date-row-${idx}`}
                          name={`dateRow-${idx}`}
                          type="text" 
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-28 font-black transition-all text-slate-900 dark:text-white"
                          aria-label={`Date for row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4 w-full">
                        <input 
                          id={`desc-row-${idx}`}
                          name={`descRow-${idx}`}
                          type="text" 
                          value={row.description}
                          onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-full font-black transition-all text-slate-900 dark:text-white"
                          aria-label={`Description for row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          id={`account-row-${idx}`}
                          name={`accountRow-${idx}`}
                          value={row.accountId}
                          onChange={(e) => handleUpdateRow(row.id, 'accountId', e.target.value)}
                          className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black text-indigo-600 dark:text-indigo-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer shadow-lg"
                          aria-label={`Account for row ${idx + 1}`}
                        >
                          <optgroup label="Assets" className="font-black text-[10px] uppercase bg-white dark:bg-slate-900">
                             <option value="bank" className="font-bold">Bank / بنك</option>
                             <option value="cash" className="font-bold">Cash / نقدية</option>
                             <option value="ar" className="font-bold">Receivables / مدينون</option>
                             <option value="inventory" className="font-bold">Inventory / مخزون</option>
                             <option value="equipment" className="font-bold">Equipment / معدات</option>
                             <option value="furniture" className="font-bold">Furniture / أثاث</option>
                             <option value="cars" className="font-bold">Cars / سيارات</option>
                             <option value="fixed_assets" className="font-bold">Fixed Assets / أصول ثابتة</option>
                          </optgroup>
                          <optgroup label="Liabilities" className="font-black text-[10px] uppercase bg-white dark:bg-slate-900">
                             <option value="ap" className="font-bold">Payables / دائنون</option>
                             <option value="short_term_loans" className="font-bold">Short Loans / قروض قصيرة</option>
                             <option value="long_term_loans" className="font-bold">Long Loans / قروض طويلة</option>
                          </optgroup>
                          <optgroup label="Equity" className="font-black text-[10px] uppercase bg-white dark:bg-slate-900">
                             <option value="capital" className="font-bold">Capital / رأس مال</option>
                             <option value="retained_earnings" className="font-bold">Retained Earnings / أرباح مبقاة</option>
                             <option value="revenue" className="font-bold">Revenue / إيرادات</option>
                             <option value="expenses" className="font-bold">Expenses / مصروفات</option>
                          </optgroup>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-end">
                        <input 
                          id={`amount-row-${idx}`}
                          name={`amountRow-${idx}`}
                          type="number" 
                          value={row.amount || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-32 text-end text-indigo-600 dark:text-indigo-400 font-black text-base transition-all"
                          aria-label={`Amount for row ${idx + 1}`}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-end pt-4 sm:pt-6 border-t border-slate-200 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:mr-auto items-stretch sm:items-center gap-3 sm:gap-4">
                <button 
                  onClick={handleAddManualRow}
                  className="px-6 py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/5"
                >
                  + {language === 'ar' ? 'إضافة صف يدوياً' : 'Add Row Manually'}
                </button>
                
                <div className="flex gap-2 sm:gap-4 p-1.5 sm:p-2 bg-slate-50 dark:bg-black/20 rounded-xl sm:rounded-[1.25rem] border border-slate-200 dark:border-white/5 justify-around">
                   <div className="px-3 sm:px-4 py-1 sm:py-1.5 flex flex-col items-center w-full">
                      <span className="text-[10px] sm:text-[11px] uppercase font-black text-slate-500 mb-0.5">{language === 'ar' ? 'إجمالي المبالغ المستخرجة' : 'Total Extracted Amount'}</span>
                      <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {parsedRows.filter(r => r.selected).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={toggleRawText}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 uppercase tracking-[0.1em]"
                >
                  {showRawText ? (language === 'ar' ? 'إخفاء النص' : 'Hide Text') : (language === 'ar' ? 'عرض النص' : 'View Text')}
                </button>
                
                <button 
                  onClick={handleImport}
                  disabled={!parsedRows.some(r => r.selected)}
                  className="flex-[2] sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-[0.2em] text-[10px] sm:text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('save')} ({parsedRows.filter(r => r.selected).length})
                </button>
              </div>
            </div>

            {showRawText && (
               <div className="mt-6 p-6 bg-slate-50 dark:bg-black/40 rounded-[1.5rem] border border-slate-200 dark:border-white/5 max-h-[250px] overflow-auto shadow-inner animate-in slide-in-from-top-2">
                  <h4 className="text-[9px] font-black text-slate-500 mb-4 sticky top-0 bg-slate-50/90 dark:bg-black/40 backdrop-blur-md uppercase tracking-[0.2em] py-2">RAW TEXT EXTRACTED:</h4>
                  <pre className="text-[11px] text-slate-700 dark:text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                     {rawText || "Processing text..."}
                  </pre>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
