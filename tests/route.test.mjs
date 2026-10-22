// Checks route.js and the data the app ships with. Run:  npm test
// The data checks run on whatever is in data/, so they also catch problems after real field data is loaded.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const Route = require('../route.js');
const load = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const places = load('places');
const paths = load('paths');

test('haversine gives sensible distances', () => {
  const a = { lat: 7.5120, lng: 4.5200 };
  assert.equal(Route.haversine(a, a), 0);
  const m = Route.haversine(a, { lat: 7.5130, lng: 4.5200 });
  assert.ok(m > 105 && m < 117, `0.001 degrees north should be about 111 m, got ${m}`);
});

test('shortest path picks the shorter of two routes', () => {
  const ps = [
    { id: 'a', lat: 7.5000, lng: 4.5000 }, { id: 'b', lat: 7.5010, lng: 4.5000 },
    { id: 'far', lat: 7.5005, lng: 4.5100 }, { id: 'c', lat: 7.5020, lng: 4.5000 }
  ];
  const g = Route.buildGraph(ps, [['a', 'b'], ['b', 'c'], ['a', 'far'], ['far', 'c']]);
  assert.deepEqual(Route.shortestPath(g, 'a', 'c').ids, ['a', 'b', 'c']);
});

test('every id in paths.json exists in places.json', () => {
  assert.doesNotThrow(() => Route.buildGraph(places, paths));
});

test('every place shown in the app can be reached on foot from the Main Gate', () => {
  const g = Route.buildGraph(places, paths);
  const start = places.find((p) => p.id === 'main_gate') ?? places[0];
  const unreachable = places
    .filter((p) => !p.hidden && p.verified && p.id !== start.id)
    .filter((p) => !Route.shortestPath(g, start.id, p.id))
    .map((p) => p.name);
  assert.deepEqual(unreachable, [], `No walking route to: ${unreachable.join(', ')}`);
});

test('every shown place uses one of the nine fixed category names', () => {
  const CATS = ['Lecture Theatres', 'Faculties', 'Hostels', 'Libraries', 'Administration', 'Essential Services', 'Gates', 'Food & Shops', 'Sports'];
  const wrong = places.filter((p) => !p.hidden && !CATS.includes(p.category)).map((p) => `${p.name} (${p.category})`);
  assert.deepEqual(wrong, []);
});
