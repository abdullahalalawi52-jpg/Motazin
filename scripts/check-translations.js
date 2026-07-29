/* eslint-env node */
import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'locales');
const baseLocale = 'en.json';

const getKeys = (obj, prefix = '') => {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
};

try {
  const baseData = JSON.parse(fs.readFileSync(path.join(localesDir, baseLocale), 'utf8'));
  const baseKeys = getKeys(baseData);
  let hasMissing = false;

  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== baseLocale);

  files.forEach(file => {
    const localeData = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    const localeKeys = getKeys(localeData);
    
    const missingKeys = baseKeys.filter(key => !localeKeys.includes(key));
    
    if (missingKeys.length > 0) {
      hasMissing = true;
      console.log(`\n❌ Missing keys in ${file}:`);
      missingKeys.forEach(key => console.log(`   - ${key}`));
    }
  });

  if (!hasMissing) {
    console.log('✅ All translation files are complete!');
  } else {
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking translations:', error);
  process.exit(1);
}
