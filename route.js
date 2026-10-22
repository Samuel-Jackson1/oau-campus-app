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
  function shortestPath(graph, from, to) {
    const dist = {}, prev = {}, done = {};
    Object.keys(graph.adj).forEach(id => { dist[id] = Infinity; });
    dist[from] = 0;
    while (true) {
      let u = null;
      for (const id in dist) if (!done[id] && (u === null || dist[id] < dist[u])) u = id;
      if (u === null || dist[u] === Infinity) return null;
      if (u === to) break;
      done[u] = true;
      for (const e of graph.adj[u]) {
        if (dist[u] + e.d < dist[e.to]) { dist[e.to] = dist[u] + e.d; prev[e.to] = u; }
      }
    }
    const ids = [to];
    while (ids[0] !== from) ids.unshift(prev[ids[0]]);
    return { ids, meters: Math.round(dist[to]) };
  }

  // -180..180 difference between two bearings (positive = turning right)
  const angleDiff = (before, after) => ((after - before + 540) % 360) - 180;
  const turnWord = diff => (Math.abs(diff) < 30 ? "straight" : diff > 0 ? "right" : "left");

  // Turns the list of ids into spoken-style steps: { turn, to, meters }.
  // "hidden" places (junctions) are never announced. Only the next real place is.
  function directions(graph, ids) {
    const named = id => !graph.byId[id].hidden;
    const steps = [];
    const stepFrom = (i, turn) => {
      let j = i + 1, m = 0;
      m += haversine(graph.byId[ids[j - 1]], graph.byId[ids[j]]);
      while (!named(ids[j]) && j < ids.length - 1) {
        j++;
        m += haversine(graph.byId[ids[j - 1]], graph.byId[ids[j]]);
      }
      steps.push({ turn, to: ids[j], meters: Math.round(m) });
    };
    if (ids.length < 2) return steps;
    stepFrom(0, "start");
    for (let i = 1; i < ids.length - 1; i++) {
      const A = graph.byId[ids[i - 1]], B = graph.byId[ids[i]], C = graph.byId[ids[i + 1]];
      const turn = turnWord(angleDiff(bearing(A, B), bearing(B, C)));
      if (turn !== "straight" || named(ids[i])) stepFrom(i, turn);
    }
    return steps;
  }

  const api = { haversine, bearing, buildGraph, shortestPath, directions };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Route = api;
})(typeof self !== "undefined" ? self : this);
