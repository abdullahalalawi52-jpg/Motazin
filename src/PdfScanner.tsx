import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import { UploadCloud, CheckCircle2, FileText, X, AlertCircle, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from './i18n';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  selected: boolean;
}

interface FileScannerProps {
  onImport: (rows: any[]) => void;
  onClose: () => void;
}

export const FileScanner: React.FC<FileScannerProps> = ({ onImport, onClose }) => {
  const { t, dir } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<'ara+eng' | 'ara' | 'eng'>('ara+eng');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setParsedRows([]);
      setProgress(0);
      
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        await processPdf(file);
      } else if (fileName.match(/\.(png|jpg|jpeg|webp)$/)) {
        await processImage(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        await processExcel(file);
      } else if (fileName.endsWith('.docx')) {
        await processWord(file);
      } else if (fileName.endsWith('.pptx')) {
        await processPowerPoint(file);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  const processPdf = async (file: File) => {
    setStatus('Extracting PDF text...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        let lastY = -1;
        let lineText = '';
        const items = content.items as any[];
        
        items.forEach((item) => {
          const y = Math.round(item.transform[5]);
          if (lastY !== -1 && Math.abs(lastY - y) > 5) {
            fullText += lineText + '\n';
            lineText = '';
          }
          lineText += item.str + ' ';
          lastY = y;
        });
        if (lineText) fullText += lineText + '\n';
    }
    extractTransactions(fullText);
  };

  const processImage = async (file: File) => {
    setStatus('Preprocessing image for higher accuracy...');
    
    // 1. Create a canvas to process the image
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // 2. Increase DPI by 2x for better OCR
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    
    // Background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 3. Simple Grayscale & Contrast enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // High contrast threshold
      const val = avg > 128 ? 255 : 0; 
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    setStatus('Initializing OCR engine...');
    const worker = await createWorker(ocrLanguage, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
          setStatus(`Recognizing ${ocrLanguage.toUpperCase()} text...`);
        }
      }
    });

    try {
      // 4. Recognize from processed canvas
      const { data: { text } } = await worker.recognize(canvas);
      setRawText(text);
      extractTransactions(text);
      URL.revokeObjectURL(objectUrl);
    } finally {
      await worker.terminate();
    }
  };

  const processExcel = async (file: File) => {
    setStatus('Reading spreadsheet data...');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Better way: convert to JSON rows to maintain column integrity
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const results: ParsedRow[] = [];
    
    const dateRegex = /(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2})/;
    
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      
      let foundDate = '';
      let foundAmount: number | null = null;
      let descriptionParts: string[] = [];

      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        const cellStr = String(cell).trim();
        
        // Try to find a date
        if (!foundDate) {
          const dm = cellStr.match(dateRegex);
          if (dm) foundDate = dm[1];
        }

        // Try to find an amount (numeric cell or string with numbers)
        if (typeof cell === 'number') {
          if (foundAmount === null || Math.abs(cell) > 0) foundAmount = Math.abs(cell);
        } else {
          const cleanAmt = cellStr.replace(/[^\d.-]/g, '');
          const val = parseFloat(cleanAmt);
          if (!isNaN(val) && Math.abs(val) > 0 && foundAmount === null) {
            foundAmount = Math.abs(val);
          } else if (cellStr.length > 2) {
            descriptionParts.push(cellStr);
          }
        }
      }

      if (foundDate && foundAmount !== null) {
        results.push({
          id: Math.random().toString(36).substr(2, 9),
          date: foundDate,
          description: descriptionParts.join(' ') || 'Excel Transaction',
          amount: foundAmount,
          accountId: 'cash',
          selected: true
        });
      }
    }

    if (results.length === 0) {
      setError('No valid transactions detected in Excel. Please ensure columns for date and amount exist.');
    } else {
      setParsedRows(results);
    }
  };

  const processWord = async (file: File) => {
    setStatus('Reading Word document...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    extractTransactions(result.value);
  };

  const processPowerPoint = async (file: File) => {
    setStatus('Parsing PowerPoint slides...');
    const zip = await JSZip.loadAsync(file);
    let fullText = '';
    
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    
    for (let i = 0; i < slideFiles.length; i++) {
      setProgress(Math.round((i / slideFiles.length) * 100));
      const content = await zip.file(slideFiles[i])?.async('string');
      if (content) {
        // Simple XML tag stripping to get text nodes <a:t>
        const textNodes = content.match(/<a:t>.*?<\/a:t>/g) || [];
        const slideText = textNodes.map(node => node.replace(/<[^>]+>/g, '')).join(' ');
        fullText += slideText + '\n';
      }
    }
    extractTransactions(fullText);
  };

  const extractTransactions = (text: string) => {
    const convertArabicDigits = (str: string) => {
      return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    };

    const normalizedText = convertArabicDigits(text);
    const lines = normalizedText.split('\n');
    const results: ParsedRow[] = [];
    
    // Global Date Detector (looks at first few lines for a single date)
    const dateRegex = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:,)? \d{2,4})\b/i;
    let globalDate = new Date().toLocaleDateString('en-GB'); // Fallback to today
    
    // Search for a date in the first 10 lines as a "document date"
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const dm = lines[i].match(dateRegex);
      if (dm) {
        globalDate = dm[1];
        break;
      }
    }

    const amountRegex = /(?:^|\s|[^0-9])(-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)(?:\s|$|[^0-9])/g;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length < 3) return;

      // Multi-column split: If there's a big gap (4+ spaces)
      const parts = trimmed.split(/\s{4,}/);
      
      parts.forEach(part => {
        const lineDateMatch = part.match(dateRegex);
        const amounts: number[] = [];
        let match;
        
        amountRegex.lastIndex = 0;
        while ((match = amountRegex.exec(part)) !== null) {
          const clean = match[1].replace(/,/g, '');
          const val = parseFloat(clean);
          if (!isNaN(val) && Math.abs(val) > 0.01) {
            amounts.push(val);
          }
        }
          
        if (amounts.length === 0) return;

        const amountValue = amounts[0];
        const itemDate = lineDateMatch ? lineDateMatch[1] : globalDate;

        let desc = part;
        if (lineDateMatch) desc = desc.replace(lineDateMatch[0], '');
        amounts.forEach(a => {
          desc = desc.replace(a.toString(), '');
        });
        
        desc = desc.replace(/[٠١٢٣٤٥٦٧٨٩]/g, '').replace(/[|\\/_#*~=+<>]/g, ' ').trim();
        if (!desc || desc.length < 2) desc = 'Detected Transaction';

        // Initial Smart Mapping Guess
        let guessedAccountId = 'bank';
        const d = desc.toLowerCase();
        if (d.includes('cash') || d.includes('نقد')) guessedAccountId = 'cash';
        else if (d.includes('receivable') || d.includes('مدينون') || d.includes('ar')) guessedAccountId = 'ar';
        else if (d.includes('payable') || d.includes('دائنون') || d.includes('ap')) guessedAccountId = 'ap';
        else if (d.includes('inventory') || d.includes('مخزون')) guessedAccountId = 'inventory';
        else if (d.includes('ppe') || d.includes('equipment') || d.includes('معدات')) guessedAccountId = 'equipment';
        else if (d.includes('debt') || d.includes('loan')) guessedAccountId = 'short_term_loans';
        else if (d.includes('capital') || d.includes('رأس مال')) guessedAccountId = 'capital';

        if (!results.some(r => r.amount === Math.abs(amountValue) && r.description === desc)) {
          results.push({
            id: Math.random().toString(36).substr(2, 9),
            date: itemDate,
            description: desc,
            amount: Math.abs(amountValue),
            accountId: guessedAccountId,
            selected: true
          });
        }
      });
    });

    if (results.length === 0) {
      const snippet = text.slice(0, 150).replace(/\n/g, ' ');
      setError(`No valid patterns found. Text recognized: "${snippet}..."`);
    } else {
      setParsedRows(results);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleToggleRow = (id: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleUpdateRow = (id: string, field: keyof ParsedRow, value: any) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddManualRow = () => {
     setParsedRows(prev => [...prev, {
       id: Math.random().toString(36).substr(2, 9),
       date: new Date().toLocaleDateString('en-GB'),
       description: 'Manual Transaction',
       amount: 0,
       accountId: 'cash',
       selected: true
     }]);
  };

  const handleImport = () => {
    const selectedRows = parsedRows.filter(r => r.selected);
    onImport(selectedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={dir}>
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <UploadCloud className="text-indigo-400 w-6 h-6" />
          {t('importFiles') || 'Import Document / Image'}
        </h2>
        <p className="text-slate-400 text-[15px] mb-6">
          {t('importFilesDesc') || 'Extract transactions from PDF, Word, Excel, PPTX or Photos (Arabic/English supported).'}
        </p>

        {parsedRows.length === 0 && !isProcessing && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-4 mb-4 bg-slate-800/40 p-3 rounded-lg border border-white/5">
                <span className="text-sm font-medium text-slate-300">OCR Language:</span>
                <div className="flex gap-1">
                  {(['ara+eng', 'ara', 'eng'] as const).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setOcrLanguage(lang)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        ocrLanguage === lang ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Tip: Use <b>ENG</b> only for better results with English documents.</span>
                </div>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[300px] border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all rounded-xl flex flex-col items-center justify-center cursor-pointer p-8 text-center group"
            >
              <input 
                type="file" 
                accept=".pdf, .docx, .xlsx, .xls, .pptx, .png, .jpg, .jpeg, .webp" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className="flex gap-4 mb-4">
                <FileText className="w-10 h-10 text-rose-400" />
                <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
                <Presentation className="w-10 h-10 text-orange-400" />
                <Image className="w-10 h-10 text-sky-400" />
              </div>
              <h3 className="text-white text-lg font-medium mb-1 font-cairo">{t('clickToUpload')}</h3>
              <p className="text-sm text-slate-400 max-w-md">PDF, Word, Excel, PPTX, PNG, JPG (Max 10MB)</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-6">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
               <p className="text-white font-bold text-lg mb-2">{status}</p>
               <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="text-slate-400 text-sm mt-1">{progress}%</p>
            </div>
          </div>
        )}

        {error && !isProcessing && (
          <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {parsedRows.length > 0 && !isProcessing && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-slate-800/30 mb-4 custom-scrollbar">
              <table className="w-full text-left rtl:text-right text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-4">
                      <input 
                        type="checkbox" 
                        checked={parsedRows.every(r => r.selected)}
                        onChange={(e) => setParsedRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                      />
                    </th>
                    <th className="px-5 py-4">{t('date')}</th>
                    <th className="px-5 py-4">{t('description')}</th>
                    <th className="px-5 py-4">{t('account') || 'Account'}</th>
                    <th className="px-5 py-4">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map(row => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <input 
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => handleToggleRow(row.id)}
                          className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                        />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <input 
                          type="text" 
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-24 text-slate-300"
                        />
                      </td>
                      <td className="px-5 py-4 w-full">
                        <input 
                          type="text" 
                          value={row.description}
                          onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full text-slate-300"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={row.accountId}
                          onChange={(e) => handleUpdateRow(row.id, 'accountId', e.target.value)}
                          className="bg-slate-900/50 border border-white/10 rounded-md text-xs font-bold text-indigo-300 p-1 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <optgroup label="Assets">
                             <option value="bank">Bank / بنك</option>
                             <option value="cash">Cash / نقدية</option>
                             <option value="ar">Receivables / مدينون</option>
                             <option value="inventory">Inventory / مخزون</option>
                             <option value="equipment">Equipment / معدات</option>
                             <option value="furniture">Furniture / أثاث</option>
                             <option value="cars">Cars / سيارات</option>
                             <option value="fixed_assets">Fixed Assets / أصول ثابتة</option>
                          </optgroup>
                          <optgroup label="Liabilities">
                             <option value="ap">Payables / دائنون</option>
                             <option value="short_term_loans">Short Loans / قروض قصيرة</option>
                             <option value="long_term_loans">Long Loans / قروض طويلة</option>
                          </optgroup>
                          <optgroup label="Equity">
                             <option value="capital">Capital / رأس مال</option>
                             <option value="retained_earnings">Retained Earnings / أرباح مبقاة</option>
                             <option value="revenue">Revenue / إيرادات</option>
                             <option value="expenses">Expenses / مصروفات</option>
                          </optgroup>
                        </select>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-indigo-300" dir="ltr">
                        <input 
                          type="number" 
                          value={row.amount}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-32 text-right text-indigo-300 font-bold"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end pt-4 border-t border-white/10">
              <button 
                onClick={handleAddManualRow}
                className="mr-auto px-4 py-2 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/30"
              >
                + Add Row Manually
              </button>
              <button 
                onClick={() => setShowRawText(!showRawText)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-all border border-indigo-500/20"
              >
                {showRawText ? 'Hide Text' : 'View Detected Text'}
              </button>
              <button 
                onClick={() => { setParsedRows([]); setError(null); setRawText(''); }} 
                className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                disabled={isProcessing}
              >
                {t('clear') || 'Reset'}
              </button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                {t('cancel')}
              </button>
              <button 
                onClick={handleImport}
                disabled={!parsedRows.some(r => r.selected)}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {t('save')} ({parsedRows.filter(r => r.selected).length})
              </button>
            </div>

            {showRawText && (
               <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-white/5 max-h-[300px] overflow-auto">
                  <h4 className="text-xs font-bold text-slate-500 mb-2 sticky top-0 bg-slate-950">RAW TEXT EXTRACTED:</h4>
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
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
