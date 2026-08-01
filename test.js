const text = 'ãÇ ãÚäì ÍÇÓÈå ÇåáÇß';
let normalized = text.toLowerCase().trim();
normalized = normalized.replace(/[ÃÅÂÇ]/g, 'Ç');
normalized = normalized.replace(/É/g, 'å');
normalized = normalized.replace(/ì/g, 'í');
normalized = normalized.replace(/Ä/g, 'Á');
normalized = normalized.replace(/Æ/g, 'Á');
normalized = normalized.replace(/[ğñòóõöø]/g, '');
normalized = normalized.replace(/(^|\s)Çá(\S+)/g, '\\');
const normInput = normalized;

const normalizeKeyword = (k) => {
  let n = k.toLowerCase().trim();
  n = n.replace(/[ÃÅÂÇ]/g, 'Ç');
  n = n.replace(/É/g, 'å');
  n = n.replace(/ì/g, 'í');
  n = n.replace(/Ä/g, 'Á');
  n = n.replace(/Æ/g, 'Á');
  n = n.replace(/[ğñòóõöø]/g, '');
  n = n.replace(/(^|\s)Çá(\S+)/g, '\\');
  return n;
};

const kw = 'ÍÇÓÈå ÇáÇåáÇß';
console.log('Norm input:', normInput);
console.log('Norm kw:', normalizeKeyword(kw));
console.log('Matches:', normInput.includes(normalizeKeyword(kw)));

