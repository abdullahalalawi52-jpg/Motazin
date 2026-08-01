import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../i18n';
import { cn } from '../utils/cn';

export const OfflineBadge: React.FC = () => {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom fade-in duration-500">
      <div className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border",
        "bg-rose-500/90 text-white border-rose-400/50"
      )}>
        <WifiOff className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-bold tracking-wide">
          {language === 'ar' ? 'أنت غير متصل بالإنترنت' : 'You are offline'}
        </span>
      </div>
    </div>
  );
};
