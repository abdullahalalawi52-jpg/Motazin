import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { toast } from 'sonner';

interface ReceiptData {
  amount: number | null;
  date: string | null;
  description: string | null;
  category?: string | null;
  paymentMethod?: string | null;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: ReceiptData) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose, onScanComplete }) => {
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImage(file);
    // Clear input
    e.target.value = '';
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check file size (limit to 10MB to avoid client memory issues)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(language === 'ar' ? 'حجم الصورة كبير جداً (يجب أن يكون أقل من 10 ميجابايت)' : 'Image size too large (must be less than 10MB)');
      }

      // Compress and convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Get base64 string, compress to 0.7 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const base64Data = dataUrl.split(',')[1];
            resolve(base64Data);
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process image');
      }

      if (result.success && result.data) {
        toast.success(language === 'ar' ? 'تم استخراج البيانات بنجاح!' : 'Data extracted successfully!');
        onScanComplete(result.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: unknown) {
      console.error('Scan Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
      toast.error(language === 'ar' ? 'فشل استخراج البيانات من الفاتورة' : 'Failed to extract data from receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-white/10">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-500" />
            {language === 'ar' ? 'مسح فاتورة ذكي' : 'Smart Receipt Scanner'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 dark:text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center justify-center gap-6">
          
          {!isProcessing ? (
            <>
              <p className="text-center text-slate-600 dark:text-white/70">
                {language === 'ar' 
                  ? 'قم بتصوير الفاتورة أو رفعها، وسيقوم الذكاء الاصطناعي باستخراج تفاصيلها تلقائياً لك.' 
                  : 'Take a picture of the receipt or upload it, and AI will extract the details automatically.'}
              </p>

              {error && (
                <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                {/* Camera Option */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                    {language === 'ar' ? 'التقاط صورة' : 'Take Photo'}
                  </span>
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                />

                {/* Upload Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'رفع من الجهاز' : 'Upload File'}
                  </span>
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-6 w-full">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full animate-spin"></div>
                <div className="w-20 h-20 border-4 border-indigo-600 rounded-full animate-spin absolute inset-0 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold dark:text-white mb-2">
                  {language === 'ar' ? 'جاري قراءة الفاتورة...' : 'Scanning Receipt...'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'يستخرج الذكاء الاصطناعي البيانات، يرجى الانتظار.' : 'AI is extracting data, please wait.'}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
