import type { Worker } from 'tesseract.js';
import { ParsedRow } from '../types/accounting';
import { generateId } from './uuid';
import { toIsoDateString } from './date';
import { BALANCE_TOLERANCE } from './constants';
import { preprocessImageForOcr } from './imagePreprocess';

interface ProcessCallbacks {
  setProgress: (progress: number) => void;
  setStatus: (status: string) => void;
  setRawText: (text: string) => void;
  setParsedRows: (rows: ParsedRow[]) => void;
  setError: (error: string) => void;
}

export const extractTransactions = async (
  text: string,
  geminiApiKey: string | undefined,
  callbacks: ProcessCallbacks
) => {
  const { setStatus, setParsedRows, setError } = callbacks;
  
  if (text.trim().length > 10) {
    setStatus('Analyzing document using AI for precision...');
    try {
      const isGitHubPages = window.location.hostname.includes('github.io');
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = (isGitHubPages || isLocalhost)
        ? 'https://motazin.vercel.app/api/parse'
        : '/api/parse';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          localApiKey: geminiApiKey // Pass it to backend, backend will use it or fallback to env
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          try {
            const parsed = JSON.parse(aiText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const results: ParsedRow[] = parsed.map((item: { date?: string; description?: string; amount?: string | number; accountId?: string; creditAccountId?: string }) => ({
                id: generateId(),
                date: item.date || toIsoDateString(new Date()),
                description: item.description || 'AI Extracted Item',
                amount: Math.abs(Number(item.amount) || 0),
                accountId: item.accountId || 'cash',
                creditAccountId: item.creditAccountId,
                selected: true
              })).filter((item: ParsedRow) => item.amount > 0);
              
              if (results.length > 0) {
                setParsedRows(results);
                setStatus('');
                return; // AI Succeeded!
              }
            }
          } catch (e) {
            console.error('Failed to parse Gemini JSON:', e);
          }
        }
      }
    } catch (error) {
      console.error('Gemini extraction failed, falling back to Regex:', error);
    }
    setStatus('AI extraction skipped/failed. Trying Regex fallback...');
  }

  // Enhanced multilingual text normalization (Arabic + Persian + Urdu + English)
  const normalizeFinancialText = (str: string) => {
    return str
      // Eastern Arabic numerals
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      // Persian / Urdu numerals
      .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      // Remove Tatweel / Kashida
      .replace(/\u0640/g, '')
      // Replace Arabic comma with space
      .replace(/،/g, ' ')
      // Normalize Arabic month names for standard date matching
      .replace(/يناير|كانون الثاني/g, '01')
      .replace(/فبراير|شباط/g, '02')
      .replace(/مارس|آذار/g, '03')
      .replace(/أبريل|ابريل|نيسان/g, '04')
      .replace(/مايو|أيار/g, '05')
      .replace(/يونيو|حزيران/g, '06')
      .replace(/يوليو|تموز/g, '07')
      .replace(/أغسطس|اغسطس|آب/g, '08')
      .replace(/سبتمبر|أيلول/g, '09')
      .replace(/أكتوبر|اكتوبر|تشرين الأول/g, '10')
      .replace(/نوفمبر|تشرين الثاني/g, '11')
      .replace(/ديسمبر|كانون الأول/g, '12');
  };

  const normalizedText = normalizeFinancialText(text);
  const lines = normalizedText.split('\n');
  const results: ParsedRow[] = [];
  
  // Date extraction regex matching standard, abbreviated, and Arabic dates
  const lineDateRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*\d{1,2}(?:(?:st|nd|rd|th)|,)?(?:\s*[-/,\s]\s*\d{2,4})?|\d{1,2}\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*(?:\s*[-/,\s]\s*\d{2,4})?|\d{1,4}[-/.]\d{1,2}(?:[-/.]\d{2,4})?)\b/i;
  
  let currentContextDate = toIsoDateString(new Date());

  // Function to normalize parsed date strings into YYYY-MM-DD
  const formatDetectedDate = (rawDate: string): string => {
    try {
      const cleaned = rawDate.replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
      const currentYear = new Date().getFullYear();
      
      // Match "Jan 20" or "Jan. 20"
      const monthDayMatch = cleaned.match(/^([a-z]+)\s*(\d{1,2})$/i);
      if (monthDayMatch) {
        const monthNames: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const mKey = monthDayMatch[1].toLowerCase().slice(0, 3);
        const mNum = monthNames[mKey] || '01';
        const dNum = monthDayMatch[2].padStart(2, '0');
        return `${currentYear}-${mNum}-${dNum}`;
      }

      // Match "20-Jan" or "20 Jan"
      const dayMonthMatch = cleaned.match(/^(\d{1,2})\s*[-/ ]\s*([a-z]+)$/i);
      if (dayMonthMatch) {
        const monthNames: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const mKey = dayMonthMatch[2].toLowerCase().slice(0, 3);
        const mNum = monthNames[mKey] || '01';
        const dNum = dayMonthMatch[1].padStart(2, '0');
        return `${currentYear}-${mNum}-${dNum}`;
      }

      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
        return toIsoDateString(parsed);
      }
    } catch {
      // Ignore date formatting errors and fallback
    }
    return currentContextDate;
  };

  // Financial Number Regex
  const amountRegex = /((?:\()?\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?(?:\))?)/g;

  lines.forEach(line => {
    let trimmed = line.trim();
    if (trimmed.length < 2) return;

    // Ignore table headers
    if (/^(?:date|description|dr\.?|cr\.?|balance|التاريخ|البيان|مدين|دائن|الرصيد)/i.test(trimmed)) {
      return;
    }

    // 1. Extract Date from line FIRST and remove it from line text so date digits are not parsed as amounts
    let lineDate = currentContextDate;
    const dateMatch = trimmed.match(lineDateRegex);
    if (dateMatch) {
      lineDate = formatDetectedDate(dateMatch[1]);
      currentContextDate = lineDate;
      // Strip date from line text
      trimmed = trimmed.replace(dateMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // 2. Extract all financial amounts in the remaining line text
    const amountsFound: { value: number; raw: string; index: number }[] = [];
    let match;
    amountRegex.lastIndex = 0;
    
    while ((match = amountRegex.exec(trimmed)) !== null) {
      let raw = match[1];
      let isNegative = false;
      if (raw.startsWith('(') && raw.endsWith(')')) {
        isNegative = true;
        raw = raw.slice(1, -1);
      }
      
      // Clean up number string
      let clean = raw.replace(/\s/g, '').replace(/o/gi, '0').replace(/[—–-]$/, '');
      
      if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/,/g, '');
      } else if (clean.includes(',')) {
        clean = clean.replace(/,/g, '');
      } else if (clean.includes('.')) {
        const parts = clean.split('.');
        // Check if dot was used as thousands separator (e.g. 40.000 or 26.000 or 3.400 in OCR)
        if (parts.length === 2 && parts[1].length === 3 && parts[1] === '000') {
          clean = parts[0] + parts[1]; // 40000
        }
      }
      
      clean = clean.replace(/[.,]$/, '');
      const val = parseFloat(clean);
      
      const looksLikeYear = /^\d{4}$/.test(clean) && val >= 2020 && val <= 2035;
      
      if (!isNaN(val) && Math.abs(val) > BALANCE_TOLERANCE && !looksLikeYear) {
        const finalVal = isNegative ? -Math.abs(val) : Math.abs(val);
        amountsFound.push({ value: finalVal, raw: match[1], index: match.index });
      }
    }

    if (amountsFound.length === 0) return;

    // 3. Handle Ledger / T-Account Running Balance filter:
    // If a line has 2 or more numbers (e.g. [Transaction Amount, Running Balance]):
    // The running balance is the last number and should NOT be extracted as a separate transaction.
    const validAmounts = amountsFound.length >= 2 
      ? amountsFound.slice(0, 1) // Take the first actual transaction amount
      : amountsFound;

    validAmounts.forEach((amt) => {
      // Extract description from text surrounding the amount
      let desc = trimmed.replace(amt.raw, '').replace(/[|\\/_#*~=+<>—–-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!desc || desc.length < 2) desc = `Transaction (${amt.raw})`;

      const d = desc.toLowerCase();
      
      const keywords: Record<string, string[]> = {
        cash: ['cash', 'نقد', 'صندوق', 'خزينة', 'petty', 'نقداً', 'كاش', 'سيولة'],
        bank: ['bank', 'بنك', 'مصرف', 'تحويل', 'سداد', 'مدى', 'فيزا', 'ماستركارد', 'حوالة'],
        ar: ['receivable', 'a/c r.a', 'a/r', 'acct 110', 'مدينون', 'عملاء', 'ذمم مدينة', 'customers', 'debtor'],
        ap: ['payable', 'a/c p.a', 'a/p', 'acct 200', 'دائنون', 'موردون', 'ذمم دائنة', 'vendors', 'suppliers'],
        inventory: ['inventory', 'مخزون', 'بضاعة', 'stock', 'supplies inventory', 'merchandise'],
        fixed_assets: ['furniture', 'equipment', 'أثاث', 'معدات', 'آلات', 'سيارات', 'fixed', 'asset', 'ppe'],
        revenue: ['revenue', 'sales', 'إيراد', 'مبيعات', 'خدمات', 'product sales'],
        expenses: ['wages', 'salaries', 'rent', 'supplies', 'expense', 'مصروف', 'تكلفة', 'أجور', 'رواتب', 'إيجار', 'كهرباء', 'مياه', 'مهمات']
      };

      let bestCategory = 'cash';
      let maxScore = 0;

      Object.entries(keywords).forEach(([id, terms]) => {
        let score = 0;
        terms.forEach(term => {
          if (d.includes(term)) {
            score += term.length; 
          }
        });
        if (score > maxScore) {
          maxScore = score;
          bestCategory = id;
        }
      });

      results.push({
        id: generateId(),
        date: lineDate,
        description: desc,
        amount: Math.abs(amt.value),
        accountId: bestCategory,
        selected: true
      });
    });
  });

  if (results.length === 0) {
    const snippet = text.slice(0, 150).replace(/\n/g, ' ');
    setError(`No patterns found. Recognized: "${snippet}..."`);
  } else {
    setParsedRows(results);
  }
};

export const processPdf = async (file: File, ocrLanguage: string, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  const { setStatus, setProgress, setRawText } = callbacks;
  setStatus('Extracting PDF text...');
  
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  let worker: Worker | null = null;
  let currentPageOCR = 1; 
  
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
        currentPageOCR = i;
        setProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const items = content.items as { str: string; transform: number[] }[];
        
        if (items.length === 0) {
            setStatus(`Page ${i} appears to be scanned. Running OCR...`);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                // @ts-expect-error - missing types for page.render
                await page.render({ canvasContext: ctx, viewport }).promise;
                
                if (!worker) {
                  const tesseract = await import('tesseract.js');
                  worker = await tesseract.createWorker(ocrLanguage, 1, {
                    logger: m => {
                      if (m.status === 'recognizing text') {
                        setProgress(Math.round(((currentPageOCR - 1) + m.progress) / pdf.numPages * 100));
                        setStatus(`OCR Page ${currentPageOCR}: Recognizing ${ocrLanguage.toUpperCase()} text...`);
                      }
                    }
                  });
                }
                
                const { data: { text } } = await worker.recognize(canvas);
                fullText += text + '\n';
            }
            continue;
        }
        
        const linesMap = new Map<number, { str: string; transform: number[] }[]>();
        
        items.forEach((item) => {
          if (!item.str.trim() && item.str !== ' ') return;
          const y = Math.round(item.transform[5]);
          
          let foundLineY = -1;
          for (const lineY of linesMap.keys()) {
              if (Math.abs(lineY - y) < 5) {
                  foundLineY = lineY;
                  break;
              }
          }
          
          if (foundLineY === -1) {
              linesMap.set(y, [item]);
          } else {
              linesMap.get(foundLineY)!.push(item);
          }
        });

        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
            const lineItems = linesMap.get(y)!;
            lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
            
            const lineText = lineItems.map(item => item.str).join(' ');
            fullText += lineText + '\n';
        });
    }
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
  
  setRawText(fullText);
  await extractTransactions(fullText, geminiApiKey, callbacks);
};

export const processImage = async (file: File, ocrLanguage: string, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  const { setStatus, setProgress, setParsedRows, setRawText, setError } = callbacks;
  setStatus('Analyzing image directly with AI Vision...');
  setProgress(20);
  
  let aiSucceeded = false;

  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });

    setProgress(50);
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiEndpoint = (isGitHubPages || isLocalhost)
      ? 'https://motazin.vercel.app/api/parse'
      : '/api/parse';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg',
        localApiKey: geminiApiKey
      })
    });

    setProgress(80);

    if (response.ok) {
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) {
        try {
          const parsed = JSON.parse(aiText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const results: ParsedRow[] = parsed.map((item: { date?: string; description?: string; amount?: string | number; accountId?: string; creditAccountId?: string }) => ({
              id: generateId(),
              date: item.date || toIsoDateString(new Date()),
              description: item.description || 'AI Extracted Item',
              amount: Math.abs(Number(item.amount) || 0),
              accountId: item.accountId || 'cash',
              creditAccountId: item.creditAccountId,
              selected: true
            })).filter((item: ParsedRow) => item.amount > 0);
            
            if (results.length > 0) {
              setParsedRows(results);
              setStatus('Extraction successful!');
              setProgress(100);
              aiSucceeded = true;
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to parse Gemini JSON from image, falling back to OCR:', e);
        }
      }
    } else {
      console.warn('AI Vision request did not return 200, falling back to OCR...');
    }
  } catch (error) {
    console.warn('AI Vision network/processing failed, falling back to OCR:', error);
  }

  // Graceful fallback: Run local OCR (Tesseract) on the image with pre-processing
  if (!aiSucceeded) {
    let worker: Worker | null = null;
    try {
      setStatus(`Pre-processing image and enhancing contrast for ${ocrLanguage.toUpperCase()} OCR...`);
      setProgress(35);

      // 1. Preprocess image on canvas (auto-scaling, grayscale, and adaptive contrast)
      let processedCanvas: HTMLCanvasElement | null = null;
      try {
        processedCanvas = await preprocessImageForOcr(file, {
          minWidth: 1800,
          contrast: 1.3,
          brightness: 5,
          grayscale: true
        });
      } catch (prepErr) {
        console.warn('Canvas pre-processing skipped, using original image:', prepErr);
      }

      setStatus(`Running local OCR (${ocrLanguage.toUpperCase()}) fallback...`);
      setProgress(50);

      const tesseract = await import('tesseract.js');
      worker = await tesseract.createWorker(ocrLanguage, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(50 + m.progress * 45));
            setStatus(`OCR: Recognizing ${ocrLanguage.toUpperCase()} text (${Math.round(m.progress * 100)}%)...`);
          }
        }
      });

      // Set optimized recognition parameters
      try {
        await worker.setParameters({
          preserve_interword_spaces: '1'
        });
      } catch {
        // Ignore parameter configuration errors if unsupported in version
      }

      const inputTarget = processedCanvas || file;
      const { data: { text: ocrText } } = await worker.recognize(inputTarget);
      
      if (ocrText && ocrText.trim().length > 0) {
        setRawText(ocrText);
        await extractTransactions(ocrText, geminiApiKey, callbacks);
        setProgress(100);
      } else {
        throw new Error('Could not extract legible text from the image.');
      }
    } catch (ocrError) {
      console.error('Image OCR fallback error:', ocrError);
      setError(ocrError instanceof Error ? ocrError.message : 'Failed to process image');
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }
};

export const processExcel = async (file: File, callbacks: ProcessCallbacks) => {
  const { setStatus, setParsedRows, setError } = callbacks;
  setStatus('Reading spreadsheet data...');
  
  const XLSX = await import('xlsx');
  
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  const results: ParsedRow[] = [];
  
  const dateRegex = /(\d{1,4}[-/.]\d{1,2}[-/.](?:\d{2,4})?|\d{1,2}[-/.]\d{1,2})/;
  
  for (const row of rows) {
    if (!row || row.length < 2) continue;
    
    let foundDate = '';
    let foundAmount: number | null = null;
    const descriptionParts: string[] = [];

    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const cellStr = String(cell).trim();
      
      if (!foundDate) {
        const dm = cellStr.match(dateRegex);
        if (dm) foundDate = dm[1];
      }

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
        id: generateId(),
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

export const processWord = async (file: File, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  callbacks.setStatus('Reading Word document...');
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  callbacks.setRawText(result.value);
  await extractTransactions(result.value, geminiApiKey, callbacks);
};

export const processPowerPoint = async (file: File, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  callbacks.setStatus('Parsing PowerPoint slides...');
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  let fullText = '';
  
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  for (let i = 0; i < slideFiles.length; i++) {
    callbacks.setProgress(Math.round((i / slideFiles.length) * 100));
    const content = await zip.file(slideFiles[i])?.async('string');
    if (content) {
      const textNodes = content.match(/<a:t>.*?<\/a:t>/g) || [];
      const slideText = textNodes.map(node => node.replace(/<[^>]+>/g, '')).join(' ');
      fullText += slideText + '\n';
    }
  }
  callbacks.setRawText(fullText);
  await extractTransactions(fullText, geminiApiKey, callbacks);
};
