import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Globe, Coins, Undo2, Redo2, LogOut, Info, Mail, Calculator, FileText, ArrowRightLeft, User as UserIcon, XCircle, Download, Plus, Trash2, Search, X, Scale, PieChart, Activity } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../i18n';
import { CURRENCIES } from '../constants/accounting';
import { MotazinLogo } from '../components/MotazinLogo';
import { authService } from '../services/authService';
import { User } from 'firebase/auth';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';

interface MainLayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: string;
  currency: string;
  handleCurrencyChange: (c: string) => void;
  accountingPeriod: 'all' | 'current_month' | 'current_year';
  setAccountingPeriod: (p: 'all' | 'current_month' | 'current_year') => void;
  historyIndex: number;
  historyLength: number;
  handleUndo: () => void;
  handleRedo: () => void;
  handleClearAll: () => void;
  setIsPdfScannerOpen: (b: boolean) => void;
  setIsSnapshotsModalOpen: (b: boolean) => void;
  setIsTransactionFormOpen: (b: boolean) => void;
  setEditingTransactionId: (id: string | null) => void;
  handleCancelEdit: () => void;
  handleGoogleLogin: () => void;
  deferredPrompt: Event | null;
  handleInstallClick: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children, user, currentView, currency, handleCurrencyChange,
  accountingPeriod, setAccountingPeriod, historyIndex, historyLength,
  handleUndo, handleRedo, handleClearAll, setIsPdfScannerOpen,
  setIsSnapshotsModalOpen, setIsTransactionFormOpen,
  setEditingTransactionId, handleCancelEdit, handleGoogleLogin,
  deferredPrompt, handleInstallClick
}) => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { globalSearchTerm, setGlobalSearchTerm } = useAppStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'equation', label: t('balanceSheet'), icon: Calculator, color: 'indigo' },
    { id: 'income', label: t('incomeStatement'), icon: FileText, color: 'indigo' },
    { id: 'cashflow', label: t('cashFlowStatement'), icon: ArrowRightLeft, color: 'indigo' },
    { id: 'trial-balance', label: t('trialBalance'), icon: Scale, color: 'indigo' },
    { id: 'equity-changes', label: t('equityChanges'), icon: PieChart, color: 'indigo' },
    { id: 'financial-ratios', label: t('financialRatiosView') || 'Financial Ratios', icon: Activity, color: 'indigo' },
    { id: 'about', label: t('aboutUs'), icon: Info, color: 'emerald' },
    { id: 'contact', label: t('contactUs'), icon: Mail, color: 'emerald' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) setIsCurrencyOpen(false);
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) setIsPeriodOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-xl">
        {t('skipToContent') || 'Skip to content'}
      </a>
      <header className={cn(
        "sticky top-2 md:top-4 z-40 transition-all duration-500 w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6",
        isScrolled ? "md:translate-y-0" : "md:translate-y-2"
      )}>
        <div className="glass w-full rounded-[2rem] md:rounded-[2.5rem] p-2 md:px-3 lg:px-4 md:py-2.5 shadow-xl md:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border dark:border-white/10 border-slate-200/50 flex flex-wrap items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-2xl overflow-hidden group transition-all duration-500 hover:scale-105 transform-gpu flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30 border border-cyan-500/20 bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-indigo-950">
              <MotazinLogo className="w-6 h-6 md:w-9 md:h-9 group-hover:scale-110 transition-transform duration-500 transform-gpu relative z-0 drop-shadow-md" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black tracking-tight leading-tight bg-gradient-to-l from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm truncate">{t('appTitle')}</h1>
              <p className="text-[9px] sm:text-[11px] font-black dark:text-cyan-400/80 text-indigo-600 uppercase tracking-widest mt-0.5 truncate">{t('appSubtitle')}</p>
            </div>
          </div>



          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2.5 dark:text-white text-black dark:hover:bg-white/10 hover:bg-slate-200/50 rounded-2xl transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <XCircle className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden md:flex items-center gap-1.5 lg:gap-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[13px] font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('installApp') || 'تثبيت التطبيق'}</span>
                </button>
              )}
              
              
              {/* Global Search Bar */}
              {currentView === 'equation' && (
                <div className={cn(
                  "hidden md:flex relative transition-all duration-300",
                  isSearchExpanded || globalSearchTerm ? "w-64" : "w-10"
                )}>
                  {(!isSearchExpanded && !globalSearchTerm) ? (
                    <button 
                      onClick={() => setIsSearchExpanded(true)}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  ) : (
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 flex items-center rtl:pr-3 ltr:pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        autoFocus
                        onBlur={() => { if (!globalSearchTerm) setIsSearchExpanded(false); }}
                        value={globalSearchTerm}
                        onChange={(e) => setGlobalSearchTerm(e.target.value)}
                        className="w-full h-10 glass-input rtl:pr-10 ltr:pl-10 rtl:pl-10 ltr:pr-10 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl transition-all outline-none focus:border-indigo-500/50"
                        placeholder={language === 'ar' ? "ابحث..." : "Search..."}
                      />
                      <button onClick={() => { setGlobalSearchTerm(''); setIsSearchExpanded(false); }} className="absolute inset-y-0 rtl:left-0 ltr:right-0 flex items-center rtl:pl-3 ltr:pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  aria-label={t('language') || 'Language'}
                  className="flex items-center gap-2 pl-3 lg:pl-9 pr-3 lg:pr-4 py-2.5 dark:bg-white/5 bg-slate-100/80 hover:bg-white/10 dark:border-white/10 border-slate-200 rounded-2xl text-[13px] font-black dark:text-white/90 text-black transition-all shadow-sm group"
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span className="hidden lg:inline-block">
                    {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : language}
                  </span>
                </button>

                {isLangOpen && (
                  <div className="absolute top-full left-0 mt-2 w-40 glass dark:bg-slate-900/95 bg-white/95 rounded-2xl border dark:border-white/10 border-slate-200 shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-left py-1">
                    {[
                      { id: 'ar', label: 'العربية' },
                      { id: 'en', label: 'English' },
                      { id: 'fr', label: 'Français' },
                      { id: 'es', label: 'Español' },
                      { id: 'tr', label: 'Türkçe' },
                      { id: 'ur', label: 'اردو' },
                      { id: 'ja', label: '日本語' },
                      { id: 'zh', label: '中文' },
                      { id: 'ru', label: 'Русский' },
                      { id: 'pt', label: 'Português' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => { setLanguage(lang.id as 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur' | 'ja' | 'zh' | 'ru' | 'pt'); setIsLangOpen(false); }}
                        className={cn(
                          "w-full px-4 py-2.5 text-right text-[13px] font-black transition-colors hover:bg-indigo-500/10",
                          language === lang.id ? "text-indigo-500 bg-indigo-500/5" : "dark:text-white/80 text-slate-700"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-2.5 dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 rounded-2xl transition-all group"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 dark:bg-white/5 bg-slate-100 px-3 py-1.5 rounded-2xl border dark:border-white/5 border-slate-200">
                <div className="relative">
                  {user ? (
                    <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-indigo-500" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                </div>
                {user ? (
                  <button onClick={() => authService.logout()} className="text-rose-400 hover:text-rose-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleGoogleLogin} className="text-[11px] font-black uppercase text-indigo-400">
                    {t('login')}
                  </button>
                )}
              </div>

              {/* Accounting Period Switcher */}
              <div className="relative" ref={periodRef}>
                <button
                  onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                  className="flex items-center gap-2 pl-3 lg:pl-9 pr-3 lg:pr-4 py-2.5 dark:bg-white/5 bg-slate-100/80 border dark:border-white/10 border-slate-200 rounded-2xl text-[13px] font-black dark:text-white/90 text-black group"
                >
                  <Globe className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden lg:inline-block">
                    {accountingPeriod === 'all' 
                      ? (language === 'ar' ? 'كل الفترات' : 'All Periods') 
                      : accountingPeriod === 'current_month' 
                        ? (language === 'ar' ? 'الشهر الحالي' : 'Current Month') 
                        : (language === 'ar' ? 'السنة الحالية' : 'Current Year')}
                  </span>
                </button>
                {isPeriodOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass dark:bg-slate-900/95 bg-white/95 rounded-2xl border dark:border-white/10 border-slate-200 shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right">
                    {[
                      { id: 'all', labelAr: 'كل الفترات', labelEn: 'All Periods' },
                      { id: 'current_month', labelAr: 'الشهر الحالي', labelEn: 'Current Month' },
                      { id: 'current_year', labelAr: 'السنة الحالية', labelEn: 'Current Year' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setAccountingPeriod(item.id as 'all' | 'current_month' | 'current_year'); setIsPeriodOpen(false); }}
                        className={cn(
                          "w-full px-4 py-2.5 text-right text-[13px] font-black transition-colors hover:bg-indigo-500/10",
                          accountingPeriod === item.id ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5" : "dark:text-white/80 text-slate-700"
                        )}
                      >
                        {language === 'ar' ? item.labelAr : item.labelEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Switcher */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  aria-label={t('currency') || 'Currency'}
                  className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-bold text-sm"
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="hidden lg:inline-block">{CURRENCIES.find(c => c.code === currency)?.symbol}</span>
                </button>
                {isCurrencyOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass dark:bg-slate-900/95 bg-white/95 rounded-2xl border dark:border-white/10 border-slate-200 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto animate-scale-in origin-top-right">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { handleCurrencyChange(c.code); setIsCurrencyOpen(false); }}
                        className={cn(
                          "w-full px-4 py-2.5 text-right text-[13px] font-black transition-colors hover:bg-emerald-500/10",
                          currency === c.code ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "dark:text-white/80 text-slate-700"
                        )}
                      >
                        {c.name} ({c.symbol})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-8 w-px dark:bg-white/5 bg-slate-200 mx-1"></div>

              <div className="flex items-center gap-1 dark:bg-black/20 bg-slate-100 p-1 rounded-xl border dark:border-white/5 border-slate-200 text-black dark:text-white">
                <button onClick={handleUndo} disabled={historyIndex < 0} className="p-2 disabled:opacity-20"><Undo2 className="w-4 h-4" /></button>
                <button onClick={handleRedo} disabled={historyIndex === historyLength - 1} className="p-2 disabled:opacity-20"><Redo2 className="w-4 h-4" /></button>
              </div>
              <button onClick={handleClearAll} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

          {/* Mobile Global Search Bar */}
          {currentView === 'equation' && (
            <div className="md:hidden mt-3 relative w-full px-1 flex justify-center">
              {(!isSearchExpanded && !globalSearchTerm) ? (
                <button 
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-full h-10 flex items-center justify-center rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              ) : (
                <div className="relative w-full">
                  <div className="absolute inset-y-0 rtl:right-1 ltr:left-1 flex items-center rtl:pr-3 ltr:pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    onBlur={() => { if (!globalSearchTerm) setIsSearchExpanded(false); }}
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    className="w-full glass-input rtl:pr-10 ltr:pl-10 py-2 text-sm text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl transition-all outline-none focus:border-indigo-500/50"
                    placeholder={language === 'ar' ? "ابحث في العمليات..." : "Search transactions..."}
                  />
                  <button onClick={() => { setGlobalSearchTerm(''); setIsSearchExpanded(false); }} className="absolute inset-y-0 rtl:left-1 ltr:right-1 flex items-center rtl:pl-3 ltr:pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
      </header>

      {/* Mobile Menu Drawer Overlay */}
      <div className={cn(
        "fixed inset-0 z-[250] md:hidden transition-all duration-300",
        isMobileMenuOpen ? "visible" : "invisible"
      )}>
        <div
          className={cn(
            "absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-500",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        <div className={cn(
          "fixed top-0 bottom-0 w-[85%] max-w-xs dark:bg-slate-900/95 bg-white/95 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[260] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col overflow-hidden",
          language === 'ar'
            ? (isMobileMenuOpen ? "right-0 rounded-l-[2.5rem]" : "-right-full rounded-l-none")
            : (isMobileMenuOpen ? "left-0 rounded-r-[2.5rem]" : "-left-full rounded-r-none")
        )} dir={dir}>
          <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-100 bg-slate-50/50 dark:bg-white/[0.02]">
            <h2 className="text-xl font-black dark:text-white text-slate-900 uppercase tracking-tight">{t('menu') || 'Menu'}</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-all bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/10 border-slate-200 shadow-sm">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-12 space-y-8">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-700/5 rounded-2xl border border-indigo-500/20 shadow-inner">
              <div className="relative">
                {user ? (
                  <img src={user.photoURL || ''} alt="Profile" className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500 shadow-lg">
                    <UserIcon className="w-7 h-7 text-indigo-400" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 dark:border-slate-900 border-white rounded-full"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-base font-black dark:text-white text-slate-900 truncate">{user ? user.displayName : t('guestUser')}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">{user ? t('proAccount') : t('offlineMode')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('navigation') || 'Navigation'}</p>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border",
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl", isActive ? "bg-white/20" : "bg-indigo-500/10")}>
                        <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-indigo-500")} />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('quickActions') || 'Quick Actions'}</p>
              <div className="space-y-2">
                {deferredPrompt && (
                  <button onClick={handleInstallClick} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-700/20">
                    <div className="p-2 rounded-xl bg-white/20"><Download className="w-5 h-5 text-white" /></div>
                    <span className="text-sm font-bold uppercase tracking-widest">{t('installApp') || 'تثبيت التطبيق'}</span>
                  </button>
                )}
                <button onClick={() => { setIsPdfScannerOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10">
                  <div className="p-2 rounded-xl bg-indigo-500/10"><Plus className="w-5 h-5 text-indigo-500" /></div>
                  <span className="text-sm font-bold uppercase tracking-widest">{t('scanPDF')}</span>
                </button>
                <button onClick={() => { setIsSnapshotsModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10">
                  <div className="p-2 rounded-xl bg-emerald-500/10"><Plus className="w-5 h-5 text-emerald-500" /></div>
                  <span className="text-sm font-bold uppercase tracking-widest">{t('backups')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('appearance') || 'Appearance'}</p>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 transition-all active:scale-95 hover:bg-slate-100 dark:hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-amber-500" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest dark:text-white/80 text-slate-700">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
                </div>
                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full relative">
                  <div className={cn("absolute top-1 w-3 h-3 rounded-full transition-all duration-300", theme === 'dark' ? "right-1 bg-indigo-400" : "left-1 bg-white")} />
                </div>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('language') || 'Language'}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ar', label: 'العربية' },
                  { id: 'en', label: 'English' },
                  { id: 'fr', label: 'Français' },
                  { id: 'es', label: 'Español' },
                  { id: 'tr', label: 'Türkçe' },
                  { id: 'ur', label: 'اردو' },
                  { id: 'ja', label: '日本語' },
                  { id: 'zh', label: '中文' },
                  { id: 'ru', label: 'Русский' },
                  { id: 'pt', label: 'Português' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { setLanguage(lang.id as 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur' | 'ja' | 'zh' | 'ru' | 'pt'); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "py-3 rounded-xl border text-[11px] font-black transition-all active:scale-95 shadow-sm",
                      language === lang.id ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-600"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 md:pt-8 z-30 relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 flex flex-col md:flex-row gap-4">
        <aside className="hidden md:flex flex-col group w-[84px] hover:w-64 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 sticky top-[6.5rem] h-[calc(100vh-8rem)] z-40">
          <nav aria-label={language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'} className="w-full">
            <div className="glass p-3 rounded-[2rem] flex flex-col gap-2 shadow-lg dark:border-white/10 border-slate-200/50 overflow-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                    onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={cn(
                      "flex items-center px-4 py-4 rounded-[1.5rem] text-[14px] font-black uppercase tracking-wider transition-all duration-300 relative active:scale-95 whitespace-nowrap",
                      isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                    title={item.label}
                  >
                    <div className="shrink-0 flex items-center justify-center">
                      <Icon className="w-[24px] h-[24px]" />
                    </div>
                    <span className="opacity-0 max-w-0 overflow-hidden transition-all duration-500 group-hover:opacity-100 group-hover:max-w-[200px] ms-0 group-hover:ms-4">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main id="main-content" className="flex-1 min-w-0 pb-32 md:pb-8 md:mb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[90] glass-card !rounded-[2.5rem] !p-1 border dark:border-white/20 border-slate-300 dark:bg-slate-900/90 bg-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] pb-safe">
        <div className="flex justify-around items-center h-14 relative">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Link
                key={item.id}
                to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[9px] font-black uppercase mt-1">
                  {item.id === 'equation' ? t('dashboard') : (language === 'ar' ? 'الدخل' : 'Income')}
                </span>
              </Link>
            );
          })}

          <div className="relative -top-8 animate-float">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-40 animate-pulse-slow -z-10 scale-105" />
            <button
              onClick={() => {
                setEditingTransactionId(null);
                handleCancelEdit();
                setIsTransactionFormOpen(true);
              }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-full shadow-[0_15px_30px_-5px_rgba(99,102,241,0.35)] flex items-center justify-center border-4 dark:border-slate-900 border-white active:scale-90 transition-all group relative z-10"
              aria-label={t('addTransaction')}
            >
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Link
                key={item.id}
                to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[9px] font-black uppercase mt-1">
                  {item.id === 'about' ? (language === 'ar' ? 'عنا' : 'About') : (language === 'ar' ? 'تواصل' : 'Contact')}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
