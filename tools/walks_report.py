"""Turns the walk files from the OAU Walk app into a review map for the team.

Put the files volunteers send (oau-walk-*.txt and oau-media-*.zip) in field-walks/, then run:

    python tools/walks_report.py

It writes field-walks/review-map.html and field-walks/review.json (never published: field-walks/ stays off GitHub).
Nothing goes into the live app by itself: the team looks at the map, names what is real, and adds it to the data.

What it works out:
  - paths: how many DIFFERENT phones walked each stretch. One person's detour is not yet a path; three people is.
  - stops: where people stayed a few minutes, which often means a place.
  - GPS gaps: where the signal dropped and came back nearby, which often means someone went into a building.
  - places: every "I am at a place" pick gives the centre of that place and, for wide places, how big it is.
  - photos and videos: each one on the map where it was taken.

Left out on purpose: walks made in the app's test mode, and anything outside the OAU boundary (tools/campus_boundary.json).
"""
import glob, json, math, os, statistics, sys, zipfile

MAX_ACC = 30          # metres: weaker readings are left out of the analysis
MAX_SPEED = 7.0       # metres a second: faster than this is a bus or a motorcycle, not a walkway
CELL = 10.0           # metres: the grid used to count how many phones walked a stretch
CONFIRMED = 3         # different phones before a stretch counts as a confirmed path
STOP_RADIUS = 30.0    # metres
STOP_TIME = 120.0     # seconds
GAP_TIME = 120.0      # seconds without GPS
GAP_NEAR = 60.0       # metres: it came back this close to where it dropped
MARK_TIME = 300.0     # seconds: a mark with no GPS is placed from the walk's position within this time


def metres(a, b):
    r = 6371000.0
    la1, la2 = math.radians(a[0]), math.radians(b[0])
    dla, dlo = la2 - la1, math.radians(b[1] - a[1])
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def cell_of(p):
    return (round(p[0] * 110540 / CELL), round(p[1] * 111320 * math.cos(math.radians(p[0])) / CELL))


def load_boundary(path):
    with open(path, encoding="utf-8") as f:
        b = json.load(f)
    return {"ring": b["ring"], "margin": b["margin"]}


def on_campus(lat, lng, boundary):
    """Inside the OAU boundary, or within its small margin (maps and GPS are not exact)."""
    if boundary is None:
        return True
    ring, inside, best = boundary["ring"], False, float("inf")
    kx, ky = math.cos(math.radians(lat)) * 111320, 110540
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[0] > lat) != (b[0] > lat) and lng < (b[1] - a[1]) * (lat - a[0]) / (b[0] - a[0]) + a[1]:
            inside = not inside
        ax, ay, dx, dy = (a[1] - lng) * kx, (a[0] - lat) * ky, (b[1] - a[1]) * kx, (b[0] - a[0]) * ky
        l2 = dx * dx + dy * dy
        u = max(0.0, min(1.0, -(ax * dx + ay * dy) / l2)) if l2 else 0.0
        best = min(best, math.hypot(ax + u * dx, ay + u * dy))
    return inside or best <= boundary["margin"]


def unpack_media(folder):
    """Opens the photo and video zips into field-walks/media/, and returns what each file is."""
    info, media = [], os.path.join(folder, "media")
    for path in sorted(glob.glob(os.path.join(folder, "*.zip"))):
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            if "media.json" not in names:
                continue
            head = json.loads(z.read("media.json").decode("utf-8"))
            if head.get("kind") != "oau-media":
                continue
            os.makedirs(media, exist_ok=True)
            for n in names:
                safe = os.path.basename(n)
                if n != "media.json" and safe == n:
                    with open(os.path.join(media, safe), "wb") as f:
                        f.write(z.read(n))
            info += [dict(m, device=head.get("device", "?")) for m in head.get("media", [])]
    return info


def load(folder):
    """Every walk once, even if a volunteer sent it twice."""
    walks = {}
    for path in sorted(glob.glob(os.path.join(folder, "*.txt")) + glob.glob(os.path.join(folder, "*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                d = json.load(f)
        except (OSError, ValueError):
            print("Skipped (not a walk file):", os.path.basename(path))
            continue
        if not isinstance(d, dict) or d.get("kind") != "oau-walk":
            continue
        for w in d.get("walks", []):
            walks[(d.get("device", "?"), w.get("id"))] = dict(w, device=d.get("device", "?"))
    return list(walks.values())


def clean(points):
    """Good readings at walking speed, in time order. Rides are split out, so a bus route never becomes a footpath."""
    out, last = [], None
    for p in sorted((p for p in points if p[2] <= MAX_ACC), key=lambda p: p[3]):
        if last is not None:
            dt = (p[3] - last[3]) / 1000.0
            if dt > 0 and metres(last, p) / dt > MAX_SPEED:
                last = p
                continue
        out.append(p)
        last = p
    return out


def find_stops(points):
    stops, i = [], 0
    while i < len(points):
        j = i
        while j + 1 < len(points) and metres(points[i], points[j + 1]) <= STOP_RADIUS:
            j += 1
        if (points[j][3] - points[i][3]) / 1000.0 >= STOP_TIME:
            part = points[i:j + 1]
            stops.append({"lat": statistics.mean(p[0] for p in part), "lng": statistics.mean(p[1] for p in part),
                          "minutes": round((points[j][3] - points[i][3]) / 60000.0, 1)})
            i = j + 1
        else:
            i += 1
    return stops


def find_gaps(points):
    gaps = []
    for a, b in zip(points, points[1:]):
        if (b[3] - a[3]) / 1000.0 >= GAP_TIME and metres(a, b) <= GAP_NEAR:
            gaps.append({"lat": (a[0] + b[0]) / 2, "lng": (a[1] + b[1]) / 2, "minutes": round((b[3] - a[3]) / 60000.0, 1)})
    return gaps


def group(items, within):
    """Joins nearby stops or gaps from all walks into one spot, and counts the different phones."""
    spots = []
    for it in items:
        for s in spots:
            if metres((s["lat"], s["lng"]), (it["lat"], it["lng"])) <= within:
                n = s["count"]
                s["lat"] = (s["lat"] * n + it["lat"]) / (n + 1)
                s["lng"] = (s["lng"] * n + it["lng"]) / (n + 1)
                s["count"] = n + 1
                s["phones"].add(it["device"])
                s["minutes"] = max(s["minutes"], it["minutes"])
                break
        else:
            spots.append({"lat": it["lat"], "lng": it["lng"], "count": 1, "phones": {it["device"]}, "minutes": it["minutes"]})
    for s in spots:
        s["phones"] = len(s["phones"])
    return sorted(spots, key=lambda s: -s["phones"])


def locate_mark(mark, points):
    """A mark's own position, or (no GPS at that moment) the walk's position nearest in time."""
    if mark.get("lat") is not None:
        return mark["lat"], mark["lng"], "gps"
    best = min(points, key=lambda p: abs(p[3] - mark["t"]), default=None)
    if best is not None and abs(best[3] - mark["t"]) / 1000.0 <= MARK_TIME:
        return best[0], best[1], "walk"
    return None


def nearest_place(lat, lng, known, within):
    best, bd = None, within
    for p in known:
        d = metres((lat, lng), (p["lat"], p["lng"])) - (p.get("radius") or 0)
        if d < bd:
            best, bd = p, d
    return best["name"] if best else None


def analyse(walks, known, boundary=None, zipped_media=()):
    cells, stops, gaps, marks, lines, phones = {}, [], [], {}, [], set()
    used = 0
    tests = [w for w in walks if w.get("test")]
    walks = [w for w in walks if not w.get("test")]
    left = {"test_walks": len(tests), "outside_points": 0, "outside_marks": 0, "outside_media": 0}
    media, seen_media = [], set()

    def add_media(m, dev, pts):
        if m.get("file") in seen_media:
            return
        seen_media.add(m.get("file"))
        at = locate_mark(m, pts)
        if at and not on_campus(at[0], at[1], boundary):
            left["outside_media"] += 1
            return
        row = {"kind": m.get("media"), "file": m.get("file"), "name": m.get("name") or "", "device": dev, "t": m.get("t")}
        if at:
            row.update(lat=round(at[0], 6), lng=round(at[1], 6))
        media.append(row)

    for w in walks:
        raw = w.get("points", [])
        kept = [p for p in raw if on_campus(p[0], p[1], boundary)]
        left["outside_points"] += len(raw) - len(kept)
        pts = clean(kept)
        dev = w["device"]
        if not pts and not w.get("marks"):
            continue
        phones.add(dev)
        used += len(pts)
        for p in pts:
            cells.setdefault(cell_of(p), set()).add(dev)
        stops += [dict(s, device=dev) for s in find_stops(pts)]
        gaps += [dict(g, device=dev) for g in find_gaps(pts)]
        for m in w.get("marks", []):
            if m.get("media"):
                add_media(m, dev, pts)
                if not m.get("name"):
                    continue
            at = locate_mark(m, pts)
            if at and not on_campus(at[0], at[1], boundary):
                left["outside_marks"] += 1
                continue
            key = m.get("place") or m["name"].strip().lower()
            e = marks.setdefault(key, {"id": m.get("place"), "name": m["name"], "points": [], "phones": set(), "unlocated": 0})
            if at:
                e["points"].append(at[:2])
                e["phones"].add(dev)
            else:
                e["unlocated"] += 1
        lines.append((dev, pts))
    # Each stretch of each walk, with how many different phones walked it.
    paths = {}
    for dev, pts in lines:
        for a, b in zip(pts, pts[1:]):
            if (b[3] - a[3]) / 1000.0 >= GAP_TIME or metres(a, b) > 80:
                continue   # a gap in the recording is not a straight path
            n = min(len(cells[cell_of(a)]), len(cells[cell_of(b)]))
            paths.setdefault(n, []).append([[round(a[0], 6), round(a[1], 6)], [round(b[0], 6), round(b[1], 6)]])
    for m in zipped_media:   # a zip whose walk file never arrived
        add_media(m, m.get("device", "?"), [])
    by_id = {p["id"]: p for p in known}
    places = []
    for key, e in marks.items():
        row = {"id": e["id"], "name": e["name"], "picks": len(e["points"]), "phones": len(e["phones"]), "unlocated": e["unlocated"]}
        if e["points"]:
            centre = (statistics.median(p[0] for p in e["points"]), statistics.median(p[1] for p in e["points"]))
            far = sorted(metres(centre, p) for p in e["points"])
            row.update(lat=round(centre[0], 6), lng=round(centre[1], 6), spread=round(far[int(0.9 * (len(far) - 1))]))
            k = by_id.get(e["id"])
            if k:
                row["from_saved"] = round(metres(centre, (k["lat"], k["lng"])))
            # A wide place shows itself: picks of the same place, from at least 3 phones, spread well beyond GPS error.
            if len(e["phones"]) >= CONFIRMED and row["spread"] >= 40:
                row["suggest_radius"] = int(round(row["spread"] / 10.0) * 10)
        row["new"] = not e["id"]
        places.append(row)
    places.sort(key=lambda r: (not r["new"], r["name"].lower()))
    spots = group(stops, STOP_RADIUS)
    for s in spots:
        s["near"] = nearest_place(s["lat"], s["lng"], known, 40)
    holes = group(gaps, GAP_NEAR)
    for s in holes:
        s["near"] = nearest_place(s["lat"], s["lng"], known, 40)
    return {"walks": len(lines), "phones": len(phones), "points": used, "left_out": left, "media": media, "paths": {str(k): v for k, v in paths.items()},
            "stops": spots, "gaps": holes, "places": places, "known": [{"lat": p["lat"], "lng": p["lng"], "name": p["name"]} for p in known]}


PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>OAU walks: review map</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="../vendor/leaflet.css">
<style>:root{color-scheme:light}body{margin:0;font-family:system-ui,sans-serif;display:flex;height:100vh;color:#16182b;background:#fff}#side{width:380px;overflow:auto;padding:14px;box-sizing:border-box}#map{flex:1}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:16px 0 4px}p,li{font-size:13px}.k{display:inline-block;width:22px;height:5px;margin-right:6px;vertical-align:middle}
table{border-collapse:collapse;width:100%;font-size:12.5px}td,th{border-bottom:1px solid #ddd;padding:3px 4px;text-align:left}th{background:#f1f2f8}.new{background:#fff4d6}
@media(max-width:800px){body{flex-direction:column}#side{width:auto;height:45vh}}</style></head><body>
<div id="side"><h1>OAU walks: review map</h1><p id="sum"></p>
<p><span class="k" style="background:#0a8f4d"></span>Confirmed: 3 or more phones<br><span class="k" style="background:#e08a00"></span>2 phones<br><span class="k" style="background:#9aa0b5"></span>1 phone only<br>
&#9679; <b style="color:#7c3aed">stop</b> (stayed a few minutes) &nbsp; &#9679; <b style="color:#d32f2f">GPS gap</b> (maybe a building) &nbsp; &#9679; <b style="color:#0d1b8e">place picked</b> &nbsp; &#9679; <b style="color:#d97706">photo or video</b></p>
<p id="left"></p><h2>Places people picked</h2><table id="pl"></table><h2>Photos and videos</h2><table id="md"></table><h2>Stops to look at</h2><table id="st"></table><h2>GPS gaps to look at</h2><table id="gp"></table>
<p>Nothing here is in the live app until the team checks it and adds it.</p></div><div id="map"></div>
<script src="../vendor/leaflet.js"></script><script>
const D = __DATA__;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const m = L.map("map"); L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"}).addTo(m);
const all = [];
for (const [n, segs] of Object.entries(D.paths)) { const c = +n >= 3 ? "#0a8f4d" : +n === 2 ? "#e08a00" : "#9aa0b5";
  L.polyline(segs, {color: c, weight: +n >= 3 ? 5 : 3, opacity: .85}).addTo(m); segs.forEach(s => all.push(s[0], s[1])); }
const dot = (s, c, t) => { L.circleMarker([s.lat, s.lng], {radius: 7, color: "#fff", weight: 2, fillColor: c, fillOpacity: 1}).addTo(m).bindPopup(t); all.push([s.lat, s.lng]); };
const nm = s => s.near ? "near " + esc(s.near) : "no saved place near";
const mediaTag = x => x.kind === "video" ? '<video src="media/' + esc(x.file) + '" controls width="260"></video>' : '<img src="media/' + esc(x.file) + '" width="260" alt="">';
D.media.filter(x => x.lat).forEach(x => dot(x, "#d97706", (x.name ? "<b>" + esc(x.name) + "</b><br>" : "") + mediaTag(x)));
D.stops.forEach(s => dot(s, "#7c3aed", "Stop: " + s.phones + " phone(s), up to " + s.minutes + " min, " + nm(s)));
D.gaps.forEach(s => dot(s, "#d32f2f", "GPS gap: " + s.phones + " phone(s), up to " + s.minutes + " min, " + nm(s)));
D.places.filter(p => p.lat).forEach(p => { dot(p, "#0d1b8e", esc(p.name) + ": " + p.picks + " pick(s), " + p.phones + " phone(s)"); if (p.spread) L.circle([p.lat, p.lng], {radius: p.spread, color: "#0d1b8e", weight: 1, fillOpacity: .06}).addTo(m); });
if (all.length) m.fitBounds(all, {padding: [30, 30]}); else m.setView([7.518, 4.522], 15);
document.getElementById("sum").textContent = D.walks + " walks from " + D.phones + " phones, " + D.points + " good GPS points.";
document.getElementById("left").textContent = "Left out: " + D.left_out.test_walks + " test walks, " + D.left_out.outside_points + " points, " + D.left_out.outside_marks + " marks and " + D.left_out.outside_media + " photos or videos outside OAU.";
document.getElementById("md").innerHTML = "<tr><th>Type</th><th>Place</th><th>File</th></tr>" + D.media.map(x => "<tr><td>" + esc(x.kind) + "</td><td>" + esc(x.name || "-") + '</td><td><a href="media/' + esc(x.file) + '" target="_blank">open</a></td></tr>').join("");
document.getElementById("pl").innerHTML = "<tr><th>Place</th><th>Picks</th><th>Phones</th><th>Spread</th><th>Size to set</th></tr>" + D.places.map(p => '<tr class="' + (p.new ? "new" : "") + '"><td>' + esc(p.name) + (p.new ? " (new)" : "") + "</td><td>" + p.picks + "</td><td>" + p.phones + "</td><td>" + (p.spread != null ? p.spread + " m" : "-") + "</td><td>" + (p.suggest_radius ? p.suggest_radius + " m" : "-") + "</td></tr>").join("");
const rows = a => "<tr><th>Phones</th><th>Longest</th><th>What is there</th></tr>" + a.map(s => "<tr><td>" + s.phones + "</td><td>" + s.minutes + " min</td><td>" + esc(nm(s)) + "</td></tr>").join("");
document.getElementById("st").innerHTML = rows(D.stops); document.getElementById("gp").innerHTML = rows(D.gaps);
</script></body></html>"""


def main(folder, data_file):
    with open(data_file, encoding="utf-8") as f:
        all_places = json.load(f)
    known = [p for p in all_places if p.get("verified") and not p.get("hidden") and not p.get("waypoint")]
    here = os.path.dirname(os.path.abspath(__file__))
    boundary = load_boundary(os.path.join(here, "campus_boundary.json"))
    zipped = unpack_media(folder)
    walks = load(folder)
    if not walks and not zipped:
        print("No walk files found in", folder)
        return None
    r = analyse(walks, known, boundary, zipped)
    with open(os.path.join(folder, "review.json"), "w", encoding="utf-8") as f:
        json.dump(r, f, ensure_ascii=False, indent=1)
    page = PAGE.replace("__DATA__", json.dumps(r, ensure_ascii=False).replace("</", "<\\/"))
    with open(os.path.join(folder, "review-map.html"), "w", encoding="utf-8") as f:
        f.write(page)
    confirmed = sum(len(v) for k, v in r["paths"].items() if int(k) >= CONFIRMED)
    print(f"{r['walks']} walks, {r['phones']} phones, {r['points']} good points; {confirmed} stretches confirmed by {CONFIRMED}+ phones.")
    print(f"{len(r['stops'])} stops, {len(r['gaps'])} GPS gaps, {len(r['places'])} places picked, {len(r['media'])} photos and videos. Open field-walks/review-map.html")
    print("Left out:", r["left_out"])
    for p in r["places"]:
        if p.get("suggest_radius"):
            print(f'  {p["name"]}: wide place. To use it, add to "change" in field-fixes.json: "{p["id"]}": {{"radius": {p["suggest_radius"]}}}')
    return r


if __name__ == "__main__":
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "field-walks"), os.path.join(here, "data", "places.json"))
