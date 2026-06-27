import React from 'react';
import { Target, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '../i18n';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction } from '../types/accounting';

interface FinancialChartsProps {
  mounted: boolean;
  transactions: Transaction[];
  assetChartData: { name: string; value: number }[];
  incomeExpenseData: { name: string; amount: number }[];
  theme: string;
  currency: string;
  colors: string[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  mounted,
  transactions,
  assetChartData,
  incomeExpenseData,
  theme,
  currency,
  colors
}) => {
  const { t } = useLanguage();

  if (!mounted || transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ minWidth: 0 }}>
      {/* Asset Distribution Pie Chart */}
      <div className="glass-card p-6" style={{ minWidth: 0 }}>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-theme-primary">
          <Target className="w-5 h-5 text-indigo-600" />
          {t('assetDistribution')}
        </h2>
        <div className="h-[300px] md:h-[350px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
          {assetChartData.length > 0 ? (
            <ResponsiveContainer id="asset-distribution-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
              <PieChart>
                <Pie
                  data={assetChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center dark:text-white text-black font-bold italic">
              {t('noAssets')}
            </div>
          )}
        </div>
      </div>

      {/* Income vs Expenses Bar Chart */}
      <div className="glass-card p-6" style={{ minWidth: 0 }}>
        <h2 className="text-lg font-semibold dark:text-white text-slate-800 mb-6 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          {t('incomeExpenses')}
        </h2>
        <div className="h-[300px] md:h-[350px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
          {incomeExpenseData.some(d => d.amount > 0) ? (
            <ResponsiveContainer id="income-expense-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
              <BarChart data={incomeExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900, dy: -5 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900 }}
                  tickFormatter={(value) => new Intl.NumberFormat('ar-SA', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <Tooltip
                  formatter={(value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency }).format(value)}
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {incomeExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === t('revenue') ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center dark:text-white text-black font-bold italic">
              {t('noIncomeExpenses')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
