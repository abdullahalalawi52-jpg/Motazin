const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const translations = {
  ar: { sales: 'مبيعات', purchases: 'مشتريات' },
  en: { sales: 'Sales', purchases: 'Purchases' },
  es: { sales: 'Ventas', purchases: 'Compras' },
  fr: { sales: 'Ventes', purchases: 'Achats' },
  ja: { sales: '売上', purchases: '仕入' },
  pt: { sales: 'Vendas', purchases: 'Compras' },
  ru: { sales: 'Продажи', purchases: 'Закупки' },
  tr: { sales: 'Satışlar', purchases: 'Alımlar' },
  ur: { sales: 'فروخت', purchases: 'خریداری' },
  zh: { sales: '销售', purchases: '采购' }
};

for (const file of files) {
  const lang = file.split('.')[0];
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (translations[lang]) {
    data.sales = translations[lang].sales;
    data.purchases = translations[lang].purchases;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file}`);
  }
}
