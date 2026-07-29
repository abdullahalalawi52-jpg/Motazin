/* eslint-env node */
import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  ar: {
    backupLoaded: 'تم استعادة النسخة بنجاح!',
    dataImported: 'تم استيراد البيانات بنجاح!',
    depreciationAdded: 'تم إضافة قيد الإهلاك بنجاح!'
  },
  en: {
    backupLoaded: 'Backup loaded successfully!',
    dataImported: 'Data imported successfully!',
    depreciationAdded: 'Depreciation entry added successfully!'
  },
  fr: {
    backupLoaded: 'Sauvegarde chargée avec succès!',
    dataImported: 'Données importées avec succès!',
    depreciationAdded: 'Écriture d\'amortissement ajoutée avec succès!'
  },
  es: {
    backupLoaded: '¡Copia de seguridad cargada con éxito!',
    dataImported: '¡Datos importados con éxito!',
    depreciationAdded: '¡Entrada de depreciación añadida con éxito!'
  },
  tr: {
    backupLoaded: 'Yedek başarıyla yüklendi!',
    dataImported: 'Veriler başarıyla içe aktarıldı!',
    depreciationAdded: 'Amortisman kaydı başarıyla eklendi!'
  },
  ur: {
    backupLoaded: 'بیک اپ کامیابی سے لوڈ ہو گیا!',
    dataImported: 'ڈیٹا کامیابی سے امپورٹ ہو گیا!',
    depreciationAdded: 'فرسودگی کا اندراج کامیابی سے شامل کر دیا گیا!'
  },
  ja: {
    backupLoaded: 'バックアップが正常に読み込まれました！',
    dataImported: 'データが正常にインポートされました！',
    depreciationAdded: '減価償却仕訳が正常に追加されました！'
  },
  zh: {
    backupLoaded: '备份加载成功！',
    dataImported: '数据导入成功！',
    depreciationAdded: '折旧分录添加成功！'
  },
  ru: {
    backupLoaded: 'Резервная копия успешно загружена!',
    dataImported: 'Данные успешно импортированы!',
    depreciationAdded: 'Запись об амортизации успешно добавлена!'
  },
  pt: {
    backupLoaded: 'Backup carregado com sucesso!',
    dataImported: 'Dados importados com sucesso!',
    depreciationAdded: 'Lançamento de depreciação adicionado com sucesso!'
  }
};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const translations = newKeys[lang] || newKeys['en'];
  
  data.backupLoaded = translations.backupLoaded;
  data.dataImported = translations.dataImported;
  data.depreciationAdded = translations.depreciationAdded;
  
  // Pretty print with 2 spaces
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
});
