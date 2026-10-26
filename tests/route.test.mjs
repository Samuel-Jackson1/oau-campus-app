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

test('distancesFrom gives the same walking distance as shortestPath, for every place at once', () => {
  const ps = [
    { id: 'a', lat: 7.5000, lng: 4.5000 }, { id: 'b', lat: 7.5010, lng: 4.5000 },
    { id: 'far', lat: 7.5005, lng: 4.5100 }, { id: 'c', lat: 7.5020, lng: 4.5000 }, { id: 'alone', lat: 7.6, lng: 4.6 }
  ];
  const g = Route.buildGraph(ps, [['a', 'b'], ['b', 'c'], ['a', 'far'], ['far', 'c']]);
  const d = Route.distancesFrom(g, 'c');
  assert.equal(Math.round(d.a), Route.shortestPath(g, 'c', 'a').meters);
  assert.equal(d.alone, undefined);   // no route: no distance
});

test('shortestPath returns null when there is no route', () => {
  const g = Route.buildGraph([{ id: 'a', lat: 7.5, lng: 4.5 }, { id: 'b', lat: 7.501, lng: 4.5 }], []);
  assert.equal(Route.shortestPath(g, 'a', 'b'), null);
});

test('directions turn only at junctions and bends, and name a nearby landmark', () => {
  // A -> curve point (osm, not a junction) -> junction -> B. Both hidden points bend the path by 90 degrees.
  const ps = [
    { id: 'a', name: 'A', lat: 7.5000, lng: 4.5000 },
    { id: 'curve', hidden: true, osm: true, lat: 7.5000, lng: 4.5010 },
    { id: 'junc', hidden: true, osm: true, junction: true, lat: 7.5010, lng: 4.5010 },
    { id: 'b', name: 'B', lat: 7.5010, lng: 4.5000 },
    { id: 'shop', name: 'Shop', lat: 7.5012, lng: 4.5012 }   // about 30 m from the junction, not on the route
  ];
  const g = Route.buildGraph(ps, [['a', 'curve'], ['curve', 'junc'], ['junc', 'b']]);
  const steps = Route.directions(g, ['a', 'curve', 'junc', 'b']);
  assert.deepEqual(steps.map((s) => s.turn), ['start', 'left']);   // no step at the curve point
  assert.equal(steps[1].near, 'shop');
  assert.equal(steps[1].to, 'b');
});

test('every id in paths.json exists in places.json', () => {
  assert.doesNotThrow(() => Route.buildGraph(places, paths));
});

test('every freshers trail stop is a place people can see and search for', () => {
  const fresh = load('freshers');
  const bad = fresh.steps.filter((s) => {
    const p = places.find((x) => x.id === s.place);
    return !p || p.hidden || !p.verified || p.waypoint || !s.tip?.en;
  }).map((s) => s.place);
  assert.deepEqual(bad, [], `Fix these freshers stops in data/freshers.json: ${bad.join(', ')}`);
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

// A filled-in number becomes a Call button on the Emergency screen, so each one (except the national 112)
// must say where it came from and when it was confirmed. Empty numbers show "to be confirmed".
test('every emergency number is well formed and says who confirmed it', () => {
  const problems = [];
  for (const c of load('emergency').categories) {
    for (const k of c.contacts) {
      if (!k.number) continue;
      const name = `${c.id}: ${k.label.en}`;
      if (!/^\+?[\d ]{3,20}$/.test(k.number)) problems.push(`${name}: "${k.number}" should be digits, spaces and an optional +`);
      if (k.number === '112') continue;
      if (!k.source) problems.push(`${name}: add "source" (who gave or confirmed the number)`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k.confirmedOn ?? '')) problems.push(`${name}: add "confirmedOn" as YYYY-MM-DD`);
    }
  }
  assert.deepEqual(problems, []);
});
