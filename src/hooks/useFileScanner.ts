import { useState, useRef } from 'react';
import { ParsedRow } from '../types/accounting';
import { toIsoDateString } from '../utils/date';
import { generateId } from '../utils/uuid';
import { 
  processPdf, 
  processImage, 
  processExcel, 
  processWord, 
  processPowerPoint 
} from '../utils/fileParser';

export const useFileScanner = (
  geminiApiKey: string | undefined,
  onImport: (rows: ParsedRow[]) => void,
  onClose: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<'ara+eng' | 'ara' | 'eng'>('ara+eng');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const callbacks = {
    setProgress,
    setStatus,
    setRawText,
    setParsedRows,
    setError
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setParsedRows([]);
      setProgress(0);
      
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        await processPdf(file, ocrLanguage, geminiApiKey, callbacks);
      } else if (fileName.match(/\.(png|jpg|jpeg|webp)$/)) {
        await processImage(file, ocrLanguage, geminiApiKey, callbacks);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        await processExcel(file, callbacks);
      } else if (fileName.endsWith('.docx')) {
        await processWord(file, geminiApiKey, callbacks);
      } else if (fileName.endsWith('.pptx')) {
        await processPowerPoint(file, geminiApiKey, callbacks);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'Error processing file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
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

  const handleUpdateRow = (id: string, field: keyof ParsedRow, value: ParsedRow[keyof ParsedRow]) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddManualRow = () => {
     setParsedRows(prev => [...prev, {
       id: generateId(),
       date: toIsoDateString(new Date()),
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

  const toggleRawText = () => setShowRawText(prev => !prev);

  return {
    isProcessing,
    progress,
    status,
    parsedRows,
    setParsedRows, // for select all
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
  };
};
