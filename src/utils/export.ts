import { Transaction, Account } from '../types/accounting';
import { toast } from 'sonner';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const handleExportCSV = (
  transactions: Transaction[],
  allAccounts: Account[],
  assets: Account[],
  liabilities: Account[],
  equities: Account[],
  incomes: Account[],
  expenses: Account[],
  totals: { accounts: Record<string, number>; isBalanced: boolean },
  t: (key: string) => string
) => {
  const getImpactAmount = (tx: Transaction, accountId: string) => {
    const impact = tx.impacts.find(i => i.accountId === accountId);
    if (!impact) return 0;
    if (impact.type) {
      const account = allAccounts.find(a => a.id === accountId);
      const isCredit = impact.type === 'credit';
      if (account) {
        if (account.category === 'asset' || account.category === 'expense') {
          return isCredit ? -impact.amount : impact.amount;
        } else {
          return isCredit ? impact.amount : -impact.amount;
        }
      }
      return impact.amount;
    }
    return impact.amount;
  };

  const headers = [
    t('date'),
    t('description'),
    ...assets.map(a => t(a.name)),
    ...liabilities.map(a => t(a.name)),
    ...equities.map(a => t(a.name)),
    ...incomes.map(a => t(a.name)),
    ...expenses.map(a => t(a.name))
  ];

  const rows = transactions.map(tx => {
    return [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      ...assets.map(a => getImpactAmount(tx, a.id)),
      ...liabilities.map(a => getImpactAmount(tx, a.id)),
      ...equities.map(a => getImpactAmount(tx, a.id)),
      ...incomes.map(a => getImpactAmount(tx, a.id)),
      ...expenses.map(a => getImpactAmount(tx, a.id))
    ];
  });

  const totalsRow = [
    '',
    t('grandTotal'),
    ...assets.map(a => totals.accounts[a.id]),
    ...liabilities.map(a => totals.accounts[a.id]),
    ...equities.map(a => totals.accounts[a.id]),
    ...incomes.map(a => totals.accounts[a.id]),
    ...expenses.map(a => totals.accounts[a.id])
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    totalsRow.join(',')
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export const handleExportPDF = async (
  transactions: Transaction[],
  allAccounts: Account[],
  assets: Account[],
  liabilities: Account[],
  equities: Account[],
  incomes: Account[],
  expenses: Account[],
  totals: { accounts: Record<string, number>; isBalanced: boolean },
  t: (key: string) => string
) => {
  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'l' });

    const getImpactAmount = (tx: Transaction, accountId: string) => {
      const impact = tx.impacts.find(i => i.accountId === accountId);
      if (!impact) return '';
      if (impact.type) {
        const account = allAccounts.find(a => a.id === accountId);
        const isCredit = impact.type === 'credit';
        if (account) {
          if (account.category === 'asset' || account.category === 'expense') {
            return isCredit ? -impact.amount : impact.amount;
          } else {
            return isCredit ? impact.amount : -impact.amount;
          }
        }
        return impact.amount;
      }
      return impact.amount;
    };

    const headers = [
      t('date'),
      t('description'),
      ...assets.map(a => t(a.name)),
      ...liabilities.map(a => t(a.name)),
      ...equities.map(a => t(a.name)),
      ...incomes.map(a => t(a.name)),
      ...expenses.map(a => t(a.name))
    ];

    const body = transactions.map(tx => [
      tx.date,
      tx.description,
      ...assets.map(a => getImpactAmount(tx, a.id)),
      ...liabilities.map(a => getImpactAmount(tx, a.id)),
      ...equities.map(a => getImpactAmount(tx, a.id)),
      ...incomes.map(a => getImpactAmount(tx, a.id)),
      ...expenses.map(a => getImpactAmount(tx, a.id))
    ]);

    const totalsRow = [
      '',
      t('grandTotal'),
      ...assets.map(a => totals.accounts[a.id] || 0),
      ...liabilities.map(a => totals.accounts[a.id] || 0),
      ...equities.map(a => totals.accounts[a.id] || 0),
      ...incomes.map(a => totals.accounts[a.id] || 0),
      ...expenses.map(a => totals.accounts[a.id] || 0)
    ];
    
    body.push(totalsRow);

    // Add font for Arabic (optional, standard fonts might not support Arabic perfectly, but it's a known limitation without loading custom TTF)
    doc.text("Transactions Report", 14, 10);
    
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 15,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      theme: 'striped'
    });

    doc.save('transactions.pdf');
    toast.success(t('exportSuccess') || "PDF generated successfully");
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error(t('errorExportingPDF') + '\n' + (error as Error).message);
  }
};

export const handleExportFinancialReportPDF = async (
  assets: Account[],
  liabilities: Account[],
  equities: Account[],
  totals: { accounts: Record<string, number>; totalAssets: number; totalLiabilities: number; totalEquity: number; isBalanced: boolean },
  insights: { currentRatio: number; debtToEquity: number; netProfit: number },
  t: (key: string) => string,
  aiSummary?: string
) => {
  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'p' });
    let yPos = 20;

    // Cover Page Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('MOTAZIN', 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(t('financialReport') || "Comprehensive Financial Report", 14, 35);

    yPos = 50;

    // AI Summary Section (If provided)
    if (aiSummary) {
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229);
      doc.text(t('aiAdvisor') || "AI Executive Summary", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const splitText = doc.splitTextToSize(aiSummary, 180);
      doc.text(splitText, 14, yPos);
      yPos += (splitText.length * 6) + 10;
    }

    // Balance Sheet Section
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(t('balanceSheet') || "Balance Sheet", 14, yPos);
    yPos += 6;

    const bsBody = [
      [t('totalAssets') || "Total Assets", totals.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      [t('totalLiabilities') || "Total Liabilities", totals.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })],
      [t('totalEquity') || "Total Equity", totals.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })]
    ];

    autoTable(doc, {
      body: bsBody,
      startY: yPos,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 6 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252] }, 1: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;

    // Financial Ratios Section
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(t('financialRatiosView') || "Financial Ratios", 14, yPos);
    yPos += 6;

    const ratioBody = [
      [t('currentRatioTitle') || "Current Ratio", insights.currentRatio.toFixed(2)],
      [t('debtToEquityTitle') || "Debt to Equity", insights.debtToEquity.toFixed(2)],
      [t('netProfitMarginTitle') || "Net Profit", insights.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })]
    ];

    autoTable(doc, {
      body: ratioBody,
      startY: yPos,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 6 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252] }, 1: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    // Footer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Motazin App - Page ${i} of ${pageCount}`, 14, 285);
    }

    doc.save('financial_report.pdf');
    toast.success(t('exportSuccess') || "Report generated successfully");
  } catch (error) {
    console.error('Error exporting Report PDF:', error);
    toast.error(t('errorExportingPDF') + '\n' + (error as Error).message);
  }
};

