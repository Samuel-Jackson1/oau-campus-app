// search.js - finds the places that match what the user typed.
//
// Everything here is a "pure function": it only takes data in and gives
// results back. No internet, no page code. That means it works in the
// browser AND in the Node tests (tests/search.test.mjs).

// How good a match is. Higher = shown first.
export const SCORES = {
  exact: 100,       // "lt2" -> nickname "LT2"
  startsWith: 80,   // "hezek" -> "Hezekiah Oluwasanmi Library"
  wordStart: 70,    // "lib" -> "...Library"
  contains: 60,     // "olu" -> "Hezekiah Oluwasanmi Library"
  allWords: 50,     // "library main" -> "Main Library"
  similar: 30,      // "librery" (typo) -> "Library"
  details: 20       // word found only in the landmark/description/category
};

// Turns any text into simple lowercase words.
// "LT-2", "Lt 2" and "lt2" all end up comparable.
// Accents and Yoruba tone/under-dots are removed: "Ọ̀ṣun" -> "osun".
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Same as normalize, but with the spaces removed: "Hall 3" -> "hall3".
export function compact(text) {
  return normalize(text).replace(/ /g, '');
}

// Number of single-letter edits needed to turn a into b ("librery" -> "library" = 1).
export function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

// Scores one name or nickname against the query. Returns 0 for no match.
function scoreName(query, name) {
  const words = normalize(name).split(' ').filter(Boolean);
  const whole = words.join('');
  if (!whole) return 0;

  if (whole === query.compact) return SCORES.exact;
  if (whole.startsWith(query.compact)) return SCORES.startsWith;
  if (words.some((w) => w.startsWith(query.compact))) return SCORES.wordStart;
  if (query.compact.length >= 3 && whole.includes(query.compact)) return SCORES.contains;
  if (query.words.length > 1 && query.words.every((q) => words.some((w) => w.startsWith(q)))) {
    return SCORES.allWords;
  }

  // Typo tolerance: 1 mistake allowed for 4+ letters, 2 mistakes for 8+ letters.
  if (query.compact.length >= 4) {
    const allowed = query.compact.length >= 8 ? 2 : 1;
    const candidates = [whole, ...words];
    if (candidates.some((c) => editDistance(query.compact, c) <= allowed)) return SCORES.similar;
  }
  return 0;
}

// Checks the extra text (landmark, description, category name) - weaker match.
function scoreDetails(query, texts) {
  const words = normalize(texts.join(' ')).split(' ').filter(Boolean);
  const found = query.words.every((q) => q.length >= 3 && words.some((w) => w.startsWith(q)));
  return found ? SCORES.details : 0;
}

// Main search.
//   places     - the list from places.json
//   text       - what the user typed
//   options    - { category: "hostel", categories: [...from categories.json], limit: 20 }
// Returns [{ place, score, matchedOn }] with the best match first.
// matchedOn tells the screen WHY it matched, e.g. 'nickname "LT2"'.
export function searchPlaces(places, text, options = {}) {
  const query = { compact: compact(text), words: normalize(text).split(' ').filter(Boolean) };
  if (!query.compact) return [];

  const categoryNames = new Map((options.categories ?? []).map((c) => [c.id, c.name]));
  const results = [];

  for (const place of places) {
    if (options.category && place.category !== options.category) continue;

    let best = { score: scoreName(query, place.name), matchedOn: 'name' };
    for (const nick of place.nicknames ?? []) {
      const score = scoreName(query, nick);
      if (score > best.score) best = { score, matchedOn: `nickname "${nick}"` };
    }
    if (best.score === 0) {
      const extra = [place.landmark, place.description, categoryNames.get(place.category) ?? place.category];
      best = { score: scoreDetails(query, extra), matchedOn: 'details' };
    }
    if (best.score > 0) {
      if (best.score === SCORES.similar) best.matchedOn += ' (similar spelling)';
      results.push({ place, ...best });
    }
  }

  results.sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name));
  return results.slice(0, options.limit ?? 20);
}
