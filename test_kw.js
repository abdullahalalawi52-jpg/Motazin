
const text = 'ما معنى حاسبه اهلاك';

const normalize = (text) => {
  let normalized = text.toLowerCase().trim();
  normalized = normalized.replace(/[أإآا]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/ؤ/g, 'ء');
  normalized = normalized.replace(/ئ/g, 'ء');
  normalized = normalized.replace(/[ًٌٍَُِّ]/g, '');
  normalized = normalized.replace(/(^|\s)ال(\S+)/g, '\\');
  return normalized;
};

const normInput = normalize(text);
let match1 = normInput.includes(normalize('اهلاك'));
let match2 = normInput.includes(normalize('حاسبه الاهلاك'));
let match3 = normInput.includes(normalize('اهلا'));

console.log('normInput:', normInput);
console.log('اهلاك:', match1);
console.log('حاسبه الاهلاك:', match2);
console.log('اهلا:', match3);
