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

export const fallbackExchangeRates: Record<Currency, number> = {
  OMR: 1.0,
  USD: 2.6,      // 1 OMR = 2.6 USD
  SAR: 9.75,     // 1 OMR = 9.75 SAR
  AED: 9.55,     // 1 OMR = 9.55 AED
  KWD: 0.8,      // 1 OMR = 0.8 KWD
  BHD: 0.98,     // 1 OMR = 0.98 BHD
  QAR: 9.47,     // 1 OMR = 9.47 QAR
  EGP: 80.3,     // 1 OMR = 80.3 EGP
  EUR: 2.4,      // 1 OMR = 2.4 EUR
  GBP: 2.05,     // 1 OMR = 2.05 GBP
  JOD: 1.84,     // 1 OMR = 1.84 JOD
  JPY: 410.0,    // 1 OMR = 410 JPY
  CAD: 3.55,     // 1 OMR = 3.55 CAD
  AUD: 3.98,     // 1 OMR = 3.98 AUD
  CHF: 2.31,     // 1 OMR = 2.31 CHF
  CNY: 18.88,    // 1 OMR = 18.88 CNY
  INR: 216.5,    // 1 OMR = 216.5 INR
};

const RATES_STORAGE_KEY = 'motazin_live_exchange_rates';
const RATES_UPDATED_KEY = 'motazin_live_exchange_rates_updated';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('OMR');
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number>>(fallbackExchangeRates);

  // Load selected currency
  useEffect(() => {
    const savedCurrency = localStorage.getItem('app_currency') as Currency;
    if (savedCurrency && currencies.some(c => c.code === savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  // Fetch live exchange rates from OMR (cached for 24h)
  useEffect(() => {
    const loadRates = async () => {
      const cachedRates = localStorage.getItem(RATES_STORAGE_KEY);
      const cachedTime = localStorage.getItem(RATES_UPDATED_KEY);
      const oneDay = 24 * 60 * 60 * 1000;

      if (cachedRates && cachedTime && (Date.now() - Number(cachedTime) < oneDay)) {
        try {
          setExchangeRates(JSON.parse(cachedRates));
          return;
        } catch (e) {
          console.error('Failed to parse cached rates', e);
        }
      }

      try {
        // Fetch from open exchange rate API with OMR base
        const res = await fetch('https://open.er-api.com/v6/latest/OMR');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            const newRates: Record<Currency, number> = { ...fallbackExchangeRates };
            currencies.forEach(c => {
              if (data.rates[c.code] !== undefined) {
                newRates[c.code] = data.rates[c.code];
              }
            });
            setExchangeRates(newRates);
            localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(newRates));
            localStorage.setItem(RATES_UPDATED_KEY, String(Date.now()));
          }
        }
      } catch (err) {
        console.error('Failed to fetch live exchange rates:', err);
      }
    };

    loadRates();
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
  };

  const getCurrencyInfo = (code: Currency) => currencies.find(c => c.code === code) || currencies[0];

  const formatCurrency = (amount: number) => {
    const info = getCurrencyInfo(currency);
    const rate = exchangeRates[currency] || fallbackExchangeRates[currency] || 1.0;
    const convertedAmount = amount * rate;
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(convertedAmount || 0));
  };

  const formatCurrencyCompact = (amount: number) => {
    const info = getCurrencyInfo(currency);
    const rate = exchangeRates[currency] || fallbackExchangeRates[currency] || 1.0;
    const convertedAmount = amount * rate;
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(convertedAmount || 0));
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
