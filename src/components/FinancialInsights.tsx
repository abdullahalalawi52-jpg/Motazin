import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '../i18n';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction } from '../types/accounting';
import { cn } from '../utils/cn';

interface FinancialInsightsProps {
  transactions: Transaction[];
  totals: {
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    accounts: Record<string, number>;
  };
  insights: {
    currentRatio: number;
    debtToEquity: number;
    netProfit: number;
  };
  profitTrendData: { name: string; profit: number }[];
  theme: string;
  currency: string;
  formatCurrency: (val: number) => string;
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  transactions,
  totals,
  insights,
  profitTrendData,
  theme,
  currency,
  formatCurrency
}) => {
  const { t } = useLanguage();

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-6 animate-fade-in [animation-delay:200ms]">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-600/20 rounded-lg">
          <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold dark:text-white text-slate-800">{t('financialInsights')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Ratio Card */}
        <div className="glass-card p-6 border-l-4 border-indigo-400">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">{t('currentRatio')}</span>
            <div className={cn(
              "px-2 py-1 rounded text-[10px] font-bold uppercase",
              insights.currentRatio >= 1.5 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
            )}>
              {insights.currentRatio >= 1.5 ? t('healthyLiquidity') : t('lowLiquidity')}
            </div>
          </div>
          <div className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{insights.currentRatio.toFixed(2)}</div>
          <p className="text-xs text-slate-500">{t('currentRatioDesc')}</p>
        </div>

        {/* Debt-to-Equity Card */}
        <div className="glass-card p-6 border-l-4 border-amber-400">
          <span className="text-slate-600 dark:text-slate-400 text-sm font-bold block mb-2">{t('debtToEquity')}</span>
          <div className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{insights.debtToEquity.toFixed(2)}</div>
          <p className="text-xs text-slate-500">{t('debtToEquityDesc')}</p>
        </div>

        {/* Net Profit Card */}
        <div className="glass-card p-6 border-l-4 border-emerald-400">
          <span className="text-slate-600 dark:text-slate-400 text-sm font-bold block mb-2">{t('netProfit')}</span>
          <div className={cn(
            "text-3xl font-bold mb-1",
            insights.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {formatCurrency(insights.netProfit)}
          </div>
          <p className="text-xs text-slate-500">Total revenue minus expenses</p>
        </div>
      </div>

      {/* Profit Trend Chart */}
      <div className="glass-card p-6" style={{ minWidth: 0 }}>
        <h3 className="text-lg font-semibold dark:text-white text-slate-800 mb-6">{t('monthlyProfitTrend')}</h3>
        <div className="h-[300px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
          {profitTrendData.length > 0 ? (
            <ResponsiveContainer id="profit-trend-line-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
              <LineChart data={profitTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900, dy: -5 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900 }}
                  tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderRadius: '12px',
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                    color: theme === 'dark' ? '#fff' : '#1e293b'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">{t('noIncomeExpenses')}</div>
          )}
        </div>
      </div>
    </div>
  );
};
