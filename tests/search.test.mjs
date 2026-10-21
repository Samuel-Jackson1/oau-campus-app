// Tests for the search logic. Run:  npm test
// Uses its own small list of places, so changing data/places.json never breaks these tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, compact, editDistance, searchPlaces } from '../js/search.js';
import { parseCsv, rowToPlace, slugify } from '../tools/csv-to-json.mjs';

const categories = [
  { id: 'lecture-theatre', name: 'Lecture Theatres' },
  { id: 'hostel', name: 'Hostels / Halls' },
  { id: 'library', name: 'Libraries' }
];

const places = [
  { id: 'lt2', name: 'Lecture Theatre 2', nicknames: ['LT2'], category: 'lecture-theatre', landmark: 'Beside the bookshop', description: '' },
  { id: 'lt1', name: 'Lecture Theatre 1', nicknames: ['LT1'], category: 'lecture-theatre', landmark: '', description: '' },
  { id: 'library', name: 'Hezekiah Oluwasanmi Library', nicknames: ['HOL', 'Main Library'], category: 'library', landmark: '', description: '' },
  { id: 'awo', name: 'Awolowo Hall', nicknames: ['Awo Hall', 'Awo'], category: 'hostel', landmark: '', description: 'Male hostel' },
  { id: 'moremi', name: 'Moremi Hall', nicknames: ['Moremi'], category: 'hostel', landmark: '', description: '' }
];

const ids = (results) => results.map((r) => r.place.id);

test('normalize and compact clean up typing differences', () => {
  assert.equal(normalize('  LT-2!! '), 'lt 2');
  assert.equal(compact('Hall 3'), 'hall3');
  assert.equal(compact('Ọ̀ṣun'), 'osun');
});

test('nickname works however it is typed', () => {
  for (const typed of ['LT2', 'lt2', 'lt 2', 'Lt-2']) {
    const results = searchPlaces(places, typed);
    assert.equal(results[0].place.id, 'lt2', `"${typed}" should find LT2 first`);
    assert.equal(results[0].matchedOn, 'nickname "LT2"');
  }
});

test('official name and start of a word both match', () => {
  assert.equal(searchPlaces(places, 'Moremi Hall')[0].place.id, 'moremi');
  assert.equal(searchPlaces(places, 'lib')[0].place.id, 'library');
  assert.equal(searchPlaces(places, 'main library')[0].place.id, 'library');
});

test('exact matches come before partial ones', () => {
  assert.deepEqual(ids(searchPlaces(places, 'awo')).slice(0, 1), ['awo']);
  assert.deepEqual(ids(searchPlaces(places, 'lecture theatre')), ['lt1', 'lt2']);
});

test('one typo is forgiven', () => {
  assert.equal(editDistance('librery', 'library'), 1);
  const results = searchPlaces(places, 'librery');
  assert.equal(results[0].place.id, 'library');
  assert.match(results[0].matchedOn, /similar spelling/);
});

test('category filter only returns that category', () => {
  assert.deepEqual(ids(searchPlaces(places, 'hall', { category: 'hostel' })).sort(), ['awo', 'moremi']);
  assert.deepEqual(searchPlaces(places, 'hall', { category: 'library' }), []);
});

test('landmark, description and category name are searched too', () => {
  assert.equal(searchPlaces(places, 'bookshop', { categories })[0].place.id, 'lt2');
  assert.deepEqual(ids(searchPlaces(places, 'hostels', { categories })).sort(), ['awo', 'moremi']);
});

test('empty or nonsense search returns nothing', () => {
  assert.deepEqual(searchPlaces(places, ''), []);
  assert.deepEqual(searchPlaces(places, '   '), []);
  assert.deepEqual(searchPlaces(places, 'zzzzqqq'), []);
});

test('CSV rows from the Field team become places in the agreed format', () => {
  const csv = 'id,name,nicknames,category,zone,landmark,description,latitude,longitude,photo,directions_from_main_gate,verified,checked_by,checked_on\r\n'
    + ',Moremi Hall,Moremi; Moremi Hostel,hostel,hostels,"Near the gate, by the shop",Female hall,7.52,4.52,,Walk in | Turn left,yes,Ade,2026-10-21\r\n';
  const [header, row] = parseCsv(csv);
  const place = rowToPlace(Object.fromEntries(header.map((h, i) => [h, row[i]])));
  assert.equal(place.id, 'moremi-hall');
  assert.deepEqual(place.nicknames, ['Moremi', 'Moremi Hostel']);
  assert.equal(place.landmark, 'Near the gate, by the shop');
  assert.deepEqual(place.coordinates, { lat: 7.52, lng: 4.52 });
  assert.deepEqual(place.directionsFromMainGate, ['Walk in', 'Turn left']);
  assert.equal(place.photo, null);
  assert.equal(place.verified, true);
  assert.equal(slugify('Lecture Theatre 2 (example)'), 'lecture-theatre-2-example');
});
