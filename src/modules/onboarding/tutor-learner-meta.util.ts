import { DEFAULT_SUBJECT_CATALOG } from '@/modules/subjects/default-subject-catalog';

export type SubjectPillDto = {
  fullName: string;
  category: string;
  subjectLine: string;
  gradeLevelsDisplay: string;
};

export function buildSubjectPillsFromProspect(subjectsCsv: string): SubjectPillDto[] {
  const names = (subjectsCsv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out: SubjectPillDto[] = [];
  for (const name of names) {
    const cat = DEFAULT_SUBJECT_CATALOG.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (cat) {
      const prefix = `${cat.category} - `;
      const subjectLine = cat.name.toLowerCase().startsWith(prefix.toLowerCase())
        ? cat.name.slice(prefix.length)
        : cat.name;
      out.push({
        fullName: cat.name,
        category: cat.category,
        subjectLine,
        gradeLevelsDisplay: (cat.gradeLevels || []).join(' / '),
      });
      continue;
    }
    const dash = name.indexOf(' - ');
    if (dash > 0) {
      out.push({
        fullName: name,
        category: name.slice(0, dash).trim(),
        subjectLine: name.slice(dash + 3).trim(),
        gradeLevelsDisplay: '',
      });
    } else {
      out.push({
        fullName: name,
        category: 'Subject',
        subjectLine: name,
        gradeLevelsDisplay: '',
      });
    }
  }
  return out;
}

export function computeFeeRangeFromBaseFee(fee: number | null | undefined): {
  feeRangeMin: number;
  feeRangeMax: number;
} {
  const base = Number(fee);
  const n = Number.isFinite(base) && base > 0 ? base : 50;
  const feeRangeMin = Math.max(15, Math.round(n * 0.65));
  const feeRangeMax = Math.max(feeRangeMin + 5, Math.round(n * 1.35));
  return { feeRangeMin, feeRangeMax };
}
