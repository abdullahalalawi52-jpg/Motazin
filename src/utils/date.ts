/**
 * Formats a given date string or Date object using the specified locale.
 * @param date The date to format (string or Date object).
 * @param locale The locale to format the date with (e.g., 'en-US', 'ar-SA').
 * @returns A formatted date string.
 */
export const formatDate = (date: string | Date | undefined, locale: string = 'en-GB'): string => {
  if (!date) return '';
  
  let d = new Date(date);
  
  // If Invalid Date, try to parse custom formats like DD/MM/YYYY
  if (isNaN(d.getTime()) && typeof date === 'string') {
    // Check for DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
    const match = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed month
      let year = parseInt(match[3], 10);
      
      // Handle 2 digit years
      if (year < 100) {
        year += 2000;
      }
      
      d = new Date(year, month, day);
    } else {
      // Check for MMM-YY (e.g. Apr-19)
      const monthMatch = date.match(/^([a-zA-Z]{3})-?(\d{2,4})$/);
      if (monthMatch) {
        const monthStr = monthMatch[1];
        let year = parseInt(monthMatch[2], 10);
        if (year < 100) {
          year += 2000;
        }
        d = new Date(`${monthStr} 1, ${year}`);
      }
    }
  }

  // If still invalid, just return the original string
  if (isNaN(d.getTime())) return String(date);

  
  const isArabic = locale.startsWith('ar');
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: isArabic ? 'arab' : 'latn'
  }).format(d);
};

export const toIsoDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
