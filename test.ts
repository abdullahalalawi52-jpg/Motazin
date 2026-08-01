import { normalizeText, KEYWORDS } from './src/utils/chatUtils.ts';
const input = 'ãÇ ãÚäì ÍÇÓÈå ÇåáÇß';
const normalizedInput = normalizeText(input);
let bestKey = 'default';
let maxWeight = 0;
for (const kwRule of KEYWORDS.ar) {
  let matchCount = 0;
  for (const kw of kwRule.keywords) {
    if (normalizedInput.includes(normalizeText(kw))) {
      matchCount++;
    }
  }
  if (matchCount > 0) {
    const weight = (kwRule.weight || 1) * matchCount;
    if (weight > maxWeight) {
      maxWeight = weight;
      bestKey = kwRule.replyKey;
    }
  }
}
console.log('Normalized:', normalizedInput);
console.log('Best key:', bestKey);
