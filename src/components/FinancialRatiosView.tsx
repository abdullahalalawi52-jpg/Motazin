import React from 'react';
import { useLanguage } from '../i18n';
import { cn } from '../utils/cn';
import { Activity, Percent, TrendingUp, AlertTriangle, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { Account } from '../types/accounting';
import { handleExportFinancialReportPDF } from '../utils/export';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RatioCardProps {
  title: string;
  formula: string;
  value: string;
  desc: string;
  suffix?: string;
  statusColor: string;
  statusIcon: React.ElementType;
  statusText: string;
}

const RatioCard: React.FC<RatioCardProps> = ({ 
  title, formula, value, desc, suffix = '',
  statusColor, statusIcon: StatusIcon, statusText
}) => (
  <div className="glass-card p-6 flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-black text-slate-900 dark:text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono inline-block mt-0.5" dir="ltr">
          {formula}
        </p>
      </div>
      <div className={cn("px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-widest", statusColor)}>
        <StatusIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{statusText}</span>
      </div>
    </div>
    
    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5">
      <div className="text-3xl font-black bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2" dir="ltr">
        {value}{suffix}
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  </div>
);

interface FinancialRatiosViewProps {
  accounts: Record<string, number>;
  activeAccounts: Account[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  netIncome: number;
  profitTrendData: { name: string; profit: number }[];
}

export const FinancialRatiosView: React.FC<FinancialRatiosViewProps> = ({
  accounts,
  activeAccounts,
  totalAssets,
  totalLiabilities,
  totalEquity,
  totalRevenue,
  netIncome,
  profitTrendData
}) => {
  const { t } = useLanguage();

  // Helper to get total balance of specific subcategories or categories
  const getBalance = (types: string[]) => {
    return activeAccounts
      .filter(a => types.includes(a.id) || types.includes(a.category))
      .reduce((sum, a) => sum + Math.abs(accounts[a.id] || 0), 0);
  };

  // 1. Liquidity calculations
  const currentAssets = getBalance(['cash', 'bank', 'ar', 'inventory', 'supplies', 'prepaid_expenses', 'current_assets']);
  const inventory = getBalance(['inventory']);
  const currentLiabilities = getBalance(['ap', 'short_term_loans', 'accrued_expenses', 'unearned_revenues']);
  
  // 2. Profitability calculations
  // totalRevenue passed via props

  // Ratios
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
  
  const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  const roe = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  
  const assetTurnover = totalAssets > 0 ? totalRevenue / totalAssets : 0;

  const getStatusColor = (value: number, minGood: number, maxGood?: number) => {
    if (maxGood !== undefined) {
      return value >= minGood && value <= maxGood ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-700 dark:text-rose-400 bg-rose-500/10';
    }
    return value >= minGood ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-700 dark:text-rose-400 bg-rose-500/10';
  };



  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-10">
        <div className="flex items-center gap-4 mb-2 pb-8 border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {t('financialRatiosView') || 'Financial Ratios'}
            </h1>
            <p className="text-slate-700 dark:text-slate-400 font-medium mt-1">
              {t('financialRatiosSubtitle') || 'Comparative Analysis & Key Performance Indicators'}
            </p>
          </div>
          
          <button
            onClick={() => {
              const assets = activeAccounts.filter(a => a.category === 'asset');
              const liabilities = activeAccounts.filter(a => a.category === 'liability');
              const equities = activeAccounts.filter(a => a.category === 'equity');
              const insights = { currentRatio, debtToEquity, netProfit: netIncome };
              handleExportFinancialReportPDF(assets, liabilities, equities, { accounts, totalAssets, totalLiabilities, totalEquity, isBalanced: true }, insights, t);
            }}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('exportReport') || 'Export Report'}</span>
          </button>
        </div>
        {/* Liquidity Ratios */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {t('liquidityRatios') || 'Liquidity Ratios'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RatioCard
              title={t('currentRatioTitle') || 'Current Ratio'}
              formula={t('currentRatioFormula') || 'Current Assets / Current Liab.'}
              value={currentRatio.toFixed(2)}
              desc={t('currentRatioDescText') || 'Measures ability to pay short-term obligations.'}
              statusColor={getStatusColor(currentRatio, 1.2)}
              statusIcon={currentRatio >= 1.2 ? CheckCircle : AlertTriangle}
              statusText={currentRatio >= 1.2 ? t('good') : t('needsAttention')}
            />
            <RatioCard
              title={t('quickRatioTitle') || 'Quick Ratio'}
              formula={t('quickRatioFormula') || '(Current Assets - Inventory) / Current Liab.'}
              value={quickRatio.toFixed(2)}
              desc={t('quickRatioDescText') || 'Measures ability to meet short-term obligations with most liquid assets.'}
              statusColor={getStatusColor(quickRatio, 1.0)}
              statusIcon={quickRatio >= 1.0 ? CheckCircle : AlertTriangle}
              statusText={quickRatio >= 1.0 ? t('good') : t('needsAttention')}
            />
          </div>
        </section>

        {/* Profitability Ratios */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {t('profitabilityRatios') || 'Profitability Ratios'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RatioCard
              title={t('returnOnAssetsTitle') || 'Return on Assets (ROA)'}
              formula={t('returnOnAssetsFormula') || 'Net Income / Total Assets'}
              value={roa.toFixed(1)}
              suffix="%"
              desc={t('returnOnAssetsDescText') || 'Indicates how profitable a company is relative to its total assets.'}
              statusColor={getStatusColor(roa, 5)}
              statusIcon={roa >= 5 ? CheckCircle : AlertTriangle}
              statusText={roa >= 5 ? t('good') : t('needsAttention')}
            />
            <RatioCard
              title={t('returnOnEquityTitle') || 'Return on Equity (ROE)'}
              formula={t('returnOnEquityFormula') || 'Net Income / Total Equity'}
              value={roe.toFixed(1)}
              suffix="%"
              desc={t('returnOnEquityDescText') || 'Measures the profitability of a business in relation to the equity.'}
              statusColor={getStatusColor(roe, 10)}
              statusIcon={roe >= 10 ? CheckCircle : AlertTriangle}
              statusText={roe >= 10 ? t('good') : t('needsAttention')}
            />
            <RatioCard
              title={t('netProfitMarginTitle') || 'Net Profit Margin'}
              formula={t('netProfitMarginFormula') || 'Net Income / Total Revenue'}
              value={netProfitMargin.toFixed(1)}
              suffix="%"
              desc={t('netProfitMarginDescText') || 'Shows how much of each dollar earned by the company translates into profit.'}
              statusColor={getStatusColor(netProfitMargin, 5)}
              statusIcon={netProfitMargin >= 5 ? CheckCircle : AlertTriangle}
              statusText={netProfitMargin >= 5 ? t('good') : t('needsAttention')}
            />
          </div>
        </section>

        {/* Leverage & Efficiency Ratios */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Percent className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {t('leverageRatios') || 'Leverage Ratios'} & {t('efficiencyRatios') || 'Efficiency Ratios'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RatioCard
              title={t('debtToEquityTitle') || 'Debt to Equity Ratio'}
              formula={t('debtToEquityFormula') || 'Total Liabilities / Total Equity'}
              value={debtToEquity.toFixed(2)}
              desc={t('debtToEquityDescText') || 'Measures the degree to which a company is financing its operations through debt.'}
              statusColor={getStatusColor(debtToEquity, 0, 2)}
              statusIcon={debtToEquity <= 2 ? CheckCircle : AlertTriangle}
              statusText={debtToEquity <= 2 ? t('good') : t('needsAttention')}
            />
            <RatioCard
              title={t('debtRatioTitle') || 'Debt Ratio'}
              formula={t('debtRatioFormula') || 'Total Liabilities / Total Assets'}
              value={debtRatio.toFixed(1)}
              suffix="%"
              desc={t('debtRatioDescText') || 'Measures the proportion of a companys assets that are financed by debt.'}
              statusColor={getStatusColor(debtRatio, 0, 50)}
              statusIcon={debtRatio <= 50 ? CheckCircle : AlertTriangle}
              statusText={debtRatio <= 50 ? t('good') : t('needsAttention')}
            />
            <RatioCard
              title={t('assetTurnoverTitle') || 'Asset Turnover Ratio'}
              formula={t('assetTurnoverFormula') || 'Total Revenue / Total Assets'}
              value={assetTurnover.toFixed(2)}
              suffix="x"
              desc={t('assetTurnoverDescText') || 'Measures the value of a companys sales or revenues generated relative to the value of its assets.'}
              statusColor={getStatusColor(assetTurnover, 0.5)}
              statusIcon={assetTurnover >= 0.5 ? CheckCircle : AlertTriangle}
              statusText={assetTurnover >= 0.5 ? t('good') : t('needsAttention')}
            />
          </div>
        </section>

        {/* Profit Trend Chart */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {t('profitTrend') || 'Profit Trend (12 Months)'}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <LineChart data={profitTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};
