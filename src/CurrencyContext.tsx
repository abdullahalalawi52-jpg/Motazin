import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'KWD' | 'BHD' | 'OMR' | 'QAR' | 'EGP' | 'JOD' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const currencies: { code: Currency; symbol: string; label: string; locale: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  { code: 'SAR', symbol: 'ر.س', label: 'Saudi Riyal', locale: 'en-SA' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', locale: 'en-AE' },
  { code: 'KWD', symbol: 'د.ك', label: 'Kuwaiti Dinar', locale: 'en-KW' },
  { code: 'BHD', symbol: 'د.ب', label: 'Bahraini Dinar', locale: 'en-BH' },
  { code: 'OMR', symbol: 'ر.ع.', label: 'Omani Rial', locale: 'en-OM' },
  { code: 'QAR', symbol: 'ر.ق', label: 'Qatari Riyal', locale: 'en-QA' },
  { code: 'EGP', symbol: 'ج.م', label: 'Egyptian Pound', locale: 'en-EG' },
  { code: 'JOD', symbol: 'د.ا', label: 'Jordanian Dinar', locale: 'en-JO' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
];

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('app_currency') as Currency;
    if (savedCurrency && currencies.some(c => c.code === savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  const getCurrencyInfo = (code: Currency) => currencies.find(c => c.code === code) || currencies[0];

  const formatCurrency = (amount: number) => {
    const info = getCurrencyInfo(currency);
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  const formatCurrencyCompact = (amount: number) => {
    const info = getCurrencyInfo(currency);
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(amount || 0));
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, formatCurrencyCompact, currencySymbol: getCurrencyInfo(currency).symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
