// route.js: the "brain". Pure maths, no screen code.
// 1) distance between two points  2) shortest path (Dijkstra)  3) left/right/straight directions
(function (root) {
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;

  // Distance in metres between two {lat, lng} points
  function haversine(a, b) {
    const R = 6371000;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Compass direction (0-360) when walking from a to b
  function bearing(a, b) {
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
      Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }

  // Turn the two JSON lists into a graph. Distances come from coordinates automatically.
  function buildGraph(places, paths) {
    const byId = {}, adj = {};
    places.forEach(p => { byId[p.id] = p; adj[p.id] = []; });
    paths.forEach(([a, b]) => {
      if (!byId[a] || !byId[b]) throw new Error("paths.json uses an unknown id: " + a + " / " + b);
      const d = haversine(byId[a], byId[b]);
      adj[a].push({ to: b, d });
      adj[b].push({ to: a, d });
    });
    return { byId, adj };
  }

  // Dijkstra: shortest walkable route. Returns { ids: [...], meters } or null if no route exists.
  // Uses a small "heap" (a list that always gives back the nearest unvisited point first), so it stays fast
  // with thousands of road points from OpenStreetMap.
  function shortestPath(graph, from, to) {
    if (!graph.adj[from] || !graph.adj[to]) return null;
    const { dist, prev } = dijkstra(graph, from, to);
    if (dist[to] === undefined) return null;
    const ids = [to];
    while (ids[0] !== from) ids.unshift(prev[ids[0]]);
    return { ids, meters: Math.round(dist[to]) };
  }

  // Walking distance (metres) from one place to every place it can reach, in one go.
  // The start screen uses it to show "1.2 km · 16 min" next to every possible starting point.
  function distancesFrom(graph, from) {
    return graph.adj[from] ? dijkstra(graph, from, null).dist : {};
  }

  // The search itself. With a "to", it stops as soon as that place is reached; without one, it measures everything.
  function dijkstra(graph, from, to) {
    const dist = { [from]: 0 }, prev = {}, done = {};
    const heap = [[0, from]];
    const push = item => {
      heap.push(item);
      for (let i = heap.length - 1; i > 0;) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
      }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
        }
      }
      return top;
    };
    while (heap.length) {
      const [d, u] = pop();
      if (done[u]) continue;
      if (to !== null && u === to) break;
      done[u] = true;
      for (const e of graph.adj[u]) {
        const nd = d + e.d;
        if (!(e.to in dist) || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; push([nd, e.to]); }
      }
    }
    return { dist, prev };
  }

  // -180..180 difference between two bearings (positive = turning right)
  const angleDiff = (before, after) => ((after - before + 540) % 360) - 180;
  const turnWord = diff => (Math.abs(diff) < 30 ? "straight" : diff > 0 ? "right" : "left");

  // Turns the list of ids into spoken-style steps: { turn, to, meters }.
  // "hidden" places (junctions) are never announced. Only the next real place is.
  // OpenStreetMap road points that only follow a curve (osm, not junction) never cause a "turn" step;
  // turns are announced at real junctions, at bends the Field team saved, and at named places.
  function directions(graph, ids) {
    const named = id => !graph.byId[id].hidden;
    const corner = id => !graph.byId[id].osm || graph.byId[id].junction;
    // Landmarks: when a turn happens within 80 m of a known place, the step says "at <place>" too.
    const known = Object.values(graph.byId).filter(p => !p.hidden);
    const landmarkAt = (id, not) => {
      let best = null, bd = 80;
      for (const p of known) { const d = haversine(graph.byId[id], p); if (d < bd && p.id !== not) { bd = d; best = p.id; } }
      return best;
    };
    const steps = [];
    const stepFrom = (i, turn) => {
      let j = i + 1, m = 0;
      m += haversine(graph.byId[ids[j - 1]], graph.byId[ids[j]]);
      while (!named(ids[j]) && j < ids.length - 1) {
        j++;
        m += haversine(graph.byId[ids[j - 1]], graph.byId[ids[j]]);
      }
      const step = { turn, to: ids[j], meters: Math.round(m), from: i, end: j };   // from/end: where the step sits in ids (the map draws it)
      const near = named(ids[i]) ? null : landmarkAt(ids[i], ids[j]);
      if (near && near !== ids[0]) step.near = near;
      steps.push(step);
    };
    if (ids.length < 2) return steps;
    stepFrom(0, "start");
    for (let i = 1; i < ids.length - 1; i++) {
      const A = graph.byId[ids[i - 1]], B = graph.byId[ids[i]], C = graph.byId[ids[i + 1]];
      const turn = turnWord(angleDiff(bearing(A, B), bearing(B, C)));
      if ((turn !== "straight" && corner(ids[i])) || named(ids[i])) stepFrom(i, turn);
    }
    return steps;
  }

  const api = { haversine, bearing, buildGraph, shortestPath, distancesFrom, directions };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Route = api;
})(typeof self !== "undefined" ? self : this);
