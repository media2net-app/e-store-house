export function normalizeLocality(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// One insertion, deletion, substitution or transposition; suggestions never change the address.
function smallTypo(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  if (a.length < b.length) return a.slice(i) === b.slice(i + 1);
  if (a.length > b.length) return a.slice(i + 1) === b.slice(i);
  return a.slice(i + 1) === b.slice(i + 1)
    || a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
}

export function localitySuggestions(names: string[], query: string) {
  const q = normalizeLocality(query);
  const ranked = names.map(name => {
    const normalized = normalizeLocality(name);
    const score = !q || normalized === q ? 0 : normalized.startsWith(q) ? 1 : normalized.includes(q) ? 2
      : q.length >= 4 && smallTypo(q, normalized.split(" ").slice(0, q.split(" ").length).join(" ")) ? 3 : 4;
    return { name, score };
  });
  return ranked.filter(row => row.score < 4).sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "ro")).slice(0, 8).map(row => row.name);
}
