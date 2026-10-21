// csv-to-json.mjs - turns the Field Data team's spreadsheet into places.json entries.
//
// The Field team fills field/places-template.csv (or the same columns in Google
// Sheets, then File > Download > CSV). Back End then runs:
//
//   npm run import-csv -- path/to/batch1.csv
//
// Rows are ADDED to data/places.json. A row whose id already exists REPLACES the
// old entry, so a corrected batch can simply be imported again.
// Afterwards run "npm run validate".

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLACES_FILE = path.join(ROOT, 'data', 'places.json');

// Reads CSV text into a list of rows. Handles "quoted, text", "" quotes and
// line breaks inside quotes (what Excel and Google Sheets produce).
export function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// "Moremi Hall" -> "moremi-hall"
export function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const list = (cell, separator) => cell.split(separator).map((s) => s.trim()).filter(Boolean);
const toNumber = (cell) => (cell.trim() === '' ? null : Number(cell));

// One spreadsheet row -> one place object in the agreed format.
export function rowToPlace(r) {
  return {
    id: r.id?.trim() || slugify(r.name ?? ''),
    name: (r.name ?? '').trim(),
    nicknames: list(r.nicknames ?? '', ';'),
    category: (r.category ?? '').trim(),
    zone: (r.zone ?? '').trim(),
    landmark: (r.landmark ?? '').trim(),
    description: (r.description ?? '').trim(),
    coordinates: { lat: toNumber(r.latitude ?? ''), lng: toNumber(r.longitude ?? '') },
    photo: r.photo?.trim() || null,
    // Steps can be separated by "|" or written on separate lines in one cell.
    directionsFromMainGate: list(r.directions_from_main_gate ?? '', /\||\r?\n/),
    verified: /^(yes|y|true|1)$/i.test((r.verified ?? '').trim()),
    checkedBy: (r.checked_by ?? '').trim(),
    checkedOn: (r.checked_on ?? '').trim()
  };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.log('Usage: npm run import-csv -- path/to/file.csv');
    process.exit(1);
  }
  const [header, ...rows] = parseCsv(await readFile(csvPath, 'utf8'));
  const keys = header.map((h) => h.trim().toLowerCase());
  const incoming = rows.map((cells) => rowToPlace(Object.fromEntries(keys.map((k, i) => [k, cells[i] ?? '']))));

  const data = JSON.parse(await readFile(PLACES_FILE, 'utf8'));
  let added = 0;
  let replaced = 0;
  for (const place of incoming) {
    if (!place.name) continue;
    const index = data.places.findIndex((p) => p.id === place.id);
    if (index >= 0) { data.places[index] = place; replaced++; } else { data.places.push(place); added++; }
  }
  data.updated = new Date().toISOString().slice(0, 10);
  await writeFile(PLACES_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Imported ${csvPath}: ${added} added, ${replaced} replaced. Total places: ${data.places.length}.`);
  console.log('Now run: npm run validate');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
