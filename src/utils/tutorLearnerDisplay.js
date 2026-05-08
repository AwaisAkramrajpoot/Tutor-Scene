export function tutorFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Tutor';
  const t = fullName.trim().split(/\s+/)[0];
  return t || 'Tutor';
}

export function bioPreview(text, minLen = 35, maxLen = 50) {
  const s = (text || '').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;
  let cut = maxLen;
  while (cut > minLen && s[cut - 1] !== ' ') cut -= 1;
  if (cut <= minLen) cut = maxLen;
  return `${s.slice(0, cut).trim()}…`;
}

export function buildSubjectPillsFromCatalog(subjectsCsv, catalog) {
  const catList = Array.isArray(catalog) ? catalog : [];
  const byName = new Map(
    catList.map((c) => [String(c.name || '').toLowerCase(), c]),
  );
  const names = (subjectsCsv || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [];
  for (const name of names) {
    const cat = byName.get(name.toLowerCase());
    if (cat) {
      const prefix = `${cat.category} - `;
      const subjectLine = String(cat.name || '')
        .toLowerCase()
        .startsWith(prefix.toLowerCase())
        ? cat.name.slice(prefix.length)
        : cat.name;
      const gradeLevelsDisplay = (cat.gradeLevels || []).join(' / ');
      out.push({
        fullName: cat.name,
        category: cat.category,
        subjectLine,
        gradeLevelsDisplay,
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

export function filterSubjectPills(pills, subjectFilter, levelFilter) {
  if (!Array.isArray(pills) || !pills.length) return [];
  let out = pills;
  if (subjectFilter && String(subjectFilter).trim()) {
    const q = subjectFilter.trim().toLowerCase();
    out = out.filter(
      (p) =>
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.subjectLine || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q),
    );
  }
  if (levelFilter && String(levelFilter).trim()) {
    const lv = levelFilter.trim().toLowerCase();
    out = out.filter((p) => {
      const g = (p.gradeLevelsDisplay || '').toLowerCase();
      if (!g) return true;
      return g.includes(lv);
    });
  }
  return out;
}

export function computeFeeRangeFromBaseFee(fee) {
  const base = Number(fee);
  const n = Number.isFinite(base) && base > 0 ? base : 50;
  const feeRangeMin = Math.max(15, Math.round(n * 0.65));
  const feeRangeMax = Math.max(feeRangeMin + 5, Math.round(n * 1.35));
  return { feeRangeMin, feeRangeMax };
}

export function formatAverageResponseLabel(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return 'Average Response Time: —';
  const h = Number(hours);
  if (h < 1) return 'Average Response Time: within 1 hour';
  const ceil = Math.ceil(h);
  return `Average Response Time: ${ceil} hour${ceil === 1 ? '' : 's'}`;
}

export function formatLearnerRateDisplay(fee, feeRangeMin, feeRangeMax, selectedSubject) {
  const base = Number(fee);
  const sub = selectedSubject && String(selectedSubject).trim();
  if (sub && Number.isFinite(base)) {
    return { line: `$${Math.round(base)}/hour for ${sub.trim()}` };
  }
  const lo =
    feeRangeMin != null ? Math.round(Number(feeRangeMin)) : null;
  const hi =
    feeRangeMax != null ? Math.round(Number(feeRangeMax)) : null;
  if (
    lo != null &&
    hi != null &&
    Number.isFinite(lo) &&
    Number.isFinite(hi)
  ) {
    return { line: `$${lo}–$${hi}/hour` };
  }
  if (Number.isFinite(base)) return { line: `$${Math.round(base)}/hour` };
  return { line: '—' };
}
