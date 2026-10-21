// validate.mjs - checks the data files for mistakes before anyone publishes them.
//
// Run:  npm run validate
//
// ERRORS   = must fix (the app may break or show wrong information).
// WARNINGS = not filled in yet, or sample data that must go before the Day 4 freeze.

import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compact } from '../js/search.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Rough box around OAU Ile-Ife. A point outside it is almost always a typo
// or latitude/longitude swapped. Widen it if a real place falls outside.
const CAMPUS_BOX = { latMin: 7.42, latMax: 7.62, lngMin: 4.42, lngMax: 4.62 };
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMERGENCY_TYPES = ['medical', 'fire', 'security', 'general'];

const errors = [];
const warnings = [];

async function readJson(file) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, 'data', file), 'utf8'));
  } catch (err) {
    errors.push(`data/${file}: cannot be read as JSON (${err.message})`);
    return null;
  }
}

async function fileExists(relPath) {
  try { await access(path.join(ROOT, relPath)); return true; } catch { return false; }
}

const isText = (v) => typeof v === 'string' && v.trim() !== '';

async function checkPlaces(placesFile, categoriesFile) {
  const categoryIds = new Set((categoriesFile?.categories ?? []).map((c) => c.id));
  const zoneIds = new Set((placesFile.zones ?? []).map((z) => z.id));
  const places = placesFile.places;
  if (!Array.isArray(places)) { errors.push('places.json: "places" must be a list [ ... ]'); return; }

  const seenIds = new Set();
  const nameOwner = new Map(); // compacted name/nickname -> place id, to catch clashes

  for (const [i, p] of places.entries()) {
    const at = `places.json #${i + 1} (${p.id || p.name || 'no id'})`;

    if (!isText(p.id)) errors.push(`${at}: missing "id"`);
    else if (!ID_PATTERN.test(p.id)) errors.push(`${at}: id must be lowercase-with-dashes, e.g. "moremi-hall"`);
    else if (seenIds.has(p.id)) errors.push(`${at}: id "${p.id}" is used twice`);
    seenIds.add(p.id);

    if (!isText(p.name)) errors.push(`${at}: missing "name"`);
    if (!Array.isArray(p.nicknames)) errors.push(`${at}: "nicknames" must be a list, e.g. ["LT2"] or []`);
    if (!categoryIds.has(p.category)) errors.push(`${at}: category "${p.category}" is not in categories.json`);
    if (!zoneIds.has(p.zone)) errors.push(`${at}: zone "${p.zone}" is not in the "zones" list`);
    if (typeof p.verified !== 'boolean') errors.push(`${at}: "verified" must be true or false`);

    // Two places must never share a name or nickname, or search sends people to the wrong one.
    for (const label of [p.name, ...(p.nicknames ?? [])]) {
      const key = compact(label);
      if (!key) continue;
      const owner = nameOwner.get(key);
      if (owner && owner !== p.id) errors.push(`${at}: name/nickname "${label}" is also used by "${owner}"`);
      else nameOwner.set(key, p.id);
    }

    const c = p.coordinates;
    if (!c || c.lat == null || c.lng == null) warnings.push(`${at}: no coordinates yet (needed for the map)`);
    else if (typeof c.lat !== 'number' || typeof c.lng !== 'number') errors.push(`${at}: lat/lng must be numbers, not text`);
    else if (c.lat < CAMPUS_BOX.latMin || c.lat > CAMPUS_BOX.latMax || c.lng < CAMPUS_BOX.lngMin || c.lng > CAMPUS_BOX.lngMax) {
      errors.push(`${at}: coordinates ${c.lat}, ${c.lng} are outside the OAU area - typo, or lat/lng swapped?`);
    }

    if (!isText(p.landmark)) warnings.push(`${at}: no landmark yet`);
    if (!isText(p.description)) warnings.push(`${at}: no description yet`);
    if (!Array.isArray(p.directionsFromMainGate) || p.directionsFromMainGate.length === 0) {
      warnings.push(`${at}: no directions from the Main Gate yet`);
    }
    if (p.photo == null || p.photo === '') warnings.push(`${at}: no photo yet`);
    else if (!(await fileExists(p.photo))) errors.push(`${at}: photo file "${p.photo}" not found`);

    if (p.verified && (!isText(p.checkedBy) || !DATE_PATTERN.test(p.checkedOn ?? ''))) {
      errors.push(`${at}: verified places need "checkedBy" and "checkedOn" (YYYY-MM-DD)`);
    }
    if (!p.verified && !p.sample) warnings.push(`${at}: not verified yet`);
    if (p.sample) warnings.push(`${at}: SAMPLE entry - delete before the Day 4 freeze`);
  }
}

function checkContacts(contactsFile) {
  const contacts = contactsFile.contacts;
  if (!Array.isArray(contacts)) { errors.push('contacts.json: "contacts" must be a list [ ... ]'); return; }
  for (const [i, c] of contacts.entries()) {
    const at = `contacts.json #${i + 1} (${c.id || c.name || 'no id'})`;
    if (!isText(c.id) || !ID_PATTERN.test(c.id)) errors.push(`${at}: id must be lowercase-with-dashes`);
    if (!isText(c.name)) errors.push(`${at}: missing "name"`);
    if (!EMERGENCY_TYPES.includes(c.emergency)) errors.push(`${at}: "emergency" must be one of ${EMERGENCY_TYPES.join(', ')}`);
    if (c.phone != null && !/^\+?[0-9 ]{3,20}$/.test(c.phone)) errors.push(`${at}: phone "${c.phone}" should contain only digits, spaces and an optional +`);
    if (c.status === 'confirmed') {
      if (!c.phone) errors.push(`${at}: confirmed contacts need a phone number`);
      if (!isText(c.confirmedBy) || !DATE_PATTERN.test(c.confirmedOn ?? '')) {
        errors.push(`${at}: confirmed contacts need "confirmedBy" and "confirmedOn" (YYYY-MM-DD)`);
      }
    } else if (c.status === 'to-be-confirmed') {
      warnings.push(`${at}: to be confirmed`);
    } else {
      errors.push(`${at}: "status" must be "confirmed" or "to-be-confirmed"`);
    }
  }
}

const [placesFile, categoriesFile, contactsFile] = await Promise.all(
  ['places.json', 'categories.json', 'contacts.json'].map(readJson)
);
if (placesFile) await checkPlaces(placesFile, categoriesFile);
if (contactsFile) checkContacts(contactsFile);

for (const w of warnings) console.log(`  WARNING  ${w}`);
for (const e of errors) console.log(`  ERROR    ${e}`);
const count = placesFile?.places?.length ?? 0;
console.log(`\n${count} places checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) {
  console.log('Fix the errors before publishing.');
  process.exit(1);
}
console.log('OK - no errors.');
