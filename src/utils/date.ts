/**
 * Formats a given date string or Date object using the specified locale.
 * @param date The date to format (string or Date object).
 * @param locale The locale to format the date with (e.g., 'en-US', 'ar-SA').
 * @returns A formatted date string.
 */
export const formatDate = (date: string | Date | undefined, locale: string = 'en-GB'): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

export const toIsoDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
