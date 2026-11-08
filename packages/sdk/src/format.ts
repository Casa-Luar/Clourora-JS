import type { Lang } from './types';

const UNITS: Record<Lang, { month: [string, string]; year: [string, string] }> = {
  es: { month: ['mes', 'meses'], year: ['año', 'años'] },
  en: { month: ['month', 'months'], year: ['year', 'years'] },
  fr: { month: ['mois', 'mois'], year: ['an', 'ans'] }
};

/** "3 meses", "2 years", "1 an"; '' when the age is unknown. Under a year shows months, from one year on whole years. */
export function formatPetAge(ageMonths: number | null | undefined, lang: Lang = 'es'): string {
  if (ageMonths === null || ageMonths === undefined || ageMonths < 0) return '';
  const units = UNITS[lang] ?? UNITS.es;
  if (ageMonths < 12) {
    const months = Math.max(1, Math.floor(ageMonths));
    return `${months} ${units.month[months === 1 ? 0 : 1]}`;
  }
  const years = Math.floor(ageMonths / 12);
  return `${years} ${units.year[years === 1 ? 0 : 1]}`;
}
