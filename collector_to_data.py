# Turns the files sent from collect.html into the app's data files and photos.
# Put ALL the received field-*.txt files (older Collector versions sent field-*.json; both work) in one folder (example: field-files), then run from the app folder:
#     python collector_to_data.py field-files --out .
# Writes data/places.json, data/paths.json and images/places/*, raises the version in sw.js, and lists anything to fix.
# Drop EVERY file you receive into the folder. For each phone the program uses only its NEWEST file (a file already holds everything that phone saved),
# then merges all phones together. If a place appears twice, the newest save wins, but every path walked to or from it is kept.
# NOTE: data/places.json is rebuilt from the field files every time. Fix mistakes on the phone and re-send, not by editing places.json.
# At the end it also prints "Shortcuts to walk": close places whose walking route is missing or far too long. Send that list to Field Data.
# Back End corrections go in field-fixes.json (in the --out folder): merge duplicate places, fix names, categories and nicknames,
# remove test entries. They are applied on every run, so they survive new field files. Add --list to print every place's id.
# If osm/oau-campus-osm.json exists (tools/fetch_osm.py), OpenStreetMap roads and footpaths become the base walking network
# and each field place is joined to the nearest road. Add --no-osm to use only the walked paths.
import base64, collections, datetime, glob, heapq, json, math, os, re, sys
args = sys.argv[1:]; out = "."
if "--out" in args: i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
show_list = "--list" in args
if show_list: args.remove("--list")
use_osm = "--no-osm" not in args
if not use_osm: args.remove("--no-osm")
files = []
for a in args:
    files += sorted(glob.glob(os.path.join(a, "*.json")) + glob.glob(os.path.join(a, "*.txt"))) if os.path.isdir(a) else sorted(glob.glob(a))
if not files: sys.exit("No field files found. Example: python collector_to_data.py field-files --out .")
print("Reading", len(files), "file(s):", ", ".join(os.path.basename(f) for f in files))
CATS = {"Lecture Theatres","Faculties","Hostels","Libraries","Administration","Essential Services","Gates","Food & Shops","Sports"}
items, links, problems = {}, [], []
loaded = []
for f in files:
    try:
        with open(f, encoding="utf-8-sig") as fh: d = json.load(fh)
        if not isinstance(d, dict) or not isinstance(d.get("items"), list): raise ValueError("no 'items' list")
    except (ValueError, UnicodeDecodeError) as e:
        print("Skipping", os.path.basename(f), "- not a Field Collector file:", e); continue
    loaded.append((d.get("device") or os.path.basename(f), d.get("exportedAt") or datetime.datetime.fromtimestamp(os.path.getmtime(f)).isoformat(), f, d))
if not loaded: sys.exit("None of the files is a Field Collector file, so nothing was changed.")
newest = {}
for dev, at, f, d in loaded:
    if dev not in newest or at > newest[dev][0]: newest[dev] = (at, f, d, dev)
for dev, at, f, d in loaded:
    if newest[dev][1] != f: print("Ignoring older file from the same phone:", os.path.basename(f))
for at, f, d, dev in sorted(newest.values(), key=lambda x: x[0]):
    print("Using", os.path.basename(f), "-", len(d["items"]), "items")
    # Older Collector files call corners "bend_1", "bend_2"... on EVERY phone. Add this phone's code so two phones' corners never merge.
    rename = {it["id"]: f"bend_{dev}_{it['id'][5:]}" for it in d["items"] if it.get("kind") == "Bend" and re.fullmatch(r"bend_\d+", it["id"])}
    fix = lambda x: rename.get(x, x)
    for it in d["items"]:
        it["id"], it["linkTo"] = fix(it["id"]), fix(it.get("linkTo", ""))
        items[it["id"]] = it   # later files win
    # Paths: every walk from every phone counts. Newer Collector files carry a "links" list; older ones only have "linkTo" on each item.
    pairs = d["links"] if "links" in d else [[it["linkTo"], it["id"]] for it in d["items"] if it["linkTo"]]
    links += [(fix(a), fix(b)) for a, b in pairs]
# Back End fixes. Order: merge duplicates, then remove, then change details (so changes can use the kept id).
fixes_path = os.path.join(out, "field-fixes.json")
if os.path.exists(fixes_path):
    with open(fixes_path, encoding="utf-8-sig") as fh: fixes = json.load(fh)
    split = lambda s: [a.strip() for a in (s or "").split(",") if a.strip()]
    redirect = lambda old, new: [tuple(new if x == old else x for x in pair) for pair in links]
    done = 0
    for rule in fixes.get("same_place", []):
        keep, drop = rule["keep"], rule["merge"]
        if drop not in items: problems.append(f"field-fixes.json: '{drop}' (to merge) is not in any field file"); continue
        gone = items.pop(drop)
        if keep not in items: items[keep] = dict(gone, id=keep)
        else:  # keep the better entry's position and photo; its nicknames gain the other entry's name and nicknames
            k = items[keep]; nicknames, seen_n = [], {k["name"].lower()}
            for n in split(k.get("aliases")) + [gone["name"]] + split(gone.get("aliases")):
                if n.lower() not in seen_n: nicknames.append(n); seen_n.add(n.lower())
            k["aliases"] = ", ".join(nicknames)
        links = redirect(drop, keep); done += 1
    for pid in fixes.get("remove", []):
        if items.pop(pid, None) is None: problems.append(f"field-fixes.json: '{pid}' (to remove) is not in any field file"); continue
        links = [pair for pair in links if pid not in pair]; done += 1
    for pid, ch in fixes.get("change", {}).items():
        if pid not in items: problems.append(f"field-fixes.json: '{pid}' (to change) is not in any field file"); continue
        it = items[pid]
        for key in ("name", "category", "landmark", "description"):
            if key in ch: it[key] = ch[key]
        if "aliases" in ch: it["aliases"] = ", ".join(ch["aliases"])
        if "verified" in ch: it["unsure"] = not ch["verified"]
        done += 1
    print(f"Applied {done} fix(es) from field-fixes.json")
os.makedirs(os.path.join(out, "data"), exist_ok=True); os.makedirs(os.path.join(out, "images", "places"), exist_ok=True)
places = []
for pid, it in items.items():
    p = {"id": pid, "name": it["name"], "verified": not it.get("unsure"), "lat": it["lat"], "lng": it["lng"]}
    if it["kind"] == "Bend": p.update(name="Bend", hidden=True)
    else:
        if it.get("category") not in CATS: problems.append(f"{it['name']}: category '{it.get('category')}' is not on the list")
        p.update(category=it.get("category", ""), aliases=[a.strip() for a in it.get("aliases", "").split(",") if a.strip()], landmark=it.get("landmark", ""), description=it.get("description", ""))
        if it["kind"] == "Landmark": p["kind"] = "landmark"
        if it.get("unsure"): problems.append(f"{it['name']}: marked 'not sure'. It stays hidden in the app until someone re-checks it and saves it again")
        ph = it.get("photo", "")
        if ph.startswith("data:image/"):
            ext = "webp" if "webp" in ph[:30] else "jpg"; name = f"{pid}.{ext}"
            with open(os.path.join(out, "images", "places", name), "wb") as fh: fh.write(base64.b64decode(ph.split(",", 1)[1]))
            p["photo"] = "images/places/" + name
        elif it["kind"] == "Place": problems.append(f"{it['name']}: no photo")
    if it.get("acc", 0) > 40: problems.append(f"{it['name']}: position only good to {it['acc']} m, consider re-walking it")
    places.append(p)
paths, seen = [], set()
for a, b in links:
    if a == b or frozenset((a, b)) in seen: continue
    missing = [x for x in (a, b) if x not in items]
    if missing: problems.append(f"a walked path uses '{missing[0]}', which is not in any file (deleted on the phone?)"); continue
    seen.add(frozenset((a, b))); paths.append([a, b])
def metres(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a["lat"], a["lng"], b["lat"], b["lng"]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
# OpenStreetMap roads and footpaths: the base walking network, so routes follow real roads instead of straight lines.
# Road points are hidden in the app (like bends). A point is kept at every junction, at both ends, and about every 40 m,
# so curves keep their shape. Each field place is joined to its nearest road point if it is within SNAP_M.
SNAP_M, SPACING_M = 150, 40
osm_file = os.path.join(out, "osm", "oau-campus-osm.json")
if use_osm and os.path.exists(osm_file):
    with open(osm_file, encoding="utf-8") as fh: osm = json.load(fh)
    ways = [e for e in osm["elements"] if e["type"] == "way" and "geometry" in e and "nodes" in e]
    uses = collections.Counter(n for w in ways for n in w["nodes"])   # a node used by 2+ roads is a junction
    road = {}
    def road_point(nid, g):
        pid = f"osm_{nid}"
        if pid not in road:
            road[pid] = {"id": pid, "name": "Road", "hidden": True, "osm": True, "verified": True, "lat": round(g["lat"], 6), "lng": round(g["lon"], 6)}
            if uses[nid] > 1: road[pid]["junction"] = True   # the app only announces turns at junctions, not on curves
        return road[pid]
    osm_paths = set()
    for w in ways:
        pts = list(zip(w["nodes"], w["geometry"]))
        kept = [road_point(*pts[0])]
        for k, (nid, g) in enumerate(pts[1:], 1):
            here = {"lat": g["lat"], "lng": g["lon"]}
            if k == len(pts) - 1 or uses[nid] > 1 or metres(kept[-1], here) >= SPACING_M:
                kept.append(road_point(nid, g))
        osm_paths |= {frozenset((a["id"], b["id"])) for a, b in zip(kept, kept[1:]) if a["id"] != b["id"]}
    joined, far = 0, []
    for p in places:
        if p.get("hidden"): continue
        d, r = min(((metres(p, r), r) for r in road.values()), key=lambda x: x[0])
        if d <= SNAP_M: osm_paths.add(frozenset((p["id"], r["id"]))); joined += 1
        else: far.append(f"{p['name']} ({round(d)} m)")
    # Use the best of both: a long walked line (over LONG_M) is only a straight guess between two saved points and may cut
    # through buildings, so the real roads replace it. Short walked paths stay: they are the footpaths OSM does not know.
    LONG_M = 150
    on_road = {pid for pair in osm_paths for pid in pair}
    byid0 = {p["id"]: p for p in places}
    keep = [pair for pair in paths if metres(byid0[pair[0]], byid0[pair[1]]) <= LONG_M
            or any(x not in on_road and not byid0[x].get("hidden") for x in pair)]
    print(f"OpenStreetMap: {len(road)} road points, {len(osm_paths) - joined} road segments; {joined} places joined to the nearest road; "
          f"{len(paths) - len(keep)} long walked lines (over {LONG_M} m) replaced by real roads, {len(keep)} short walked paths kept")
    paths = keep
    places += road.values()
    paths += [sorted(pair) for pair in osm_paths]
    if far: problems.append("More than " + str(SNAP_M) + " m from any OpenStreetMap road, so only walked paths reach them: " + ", ".join(far))
# Every place must be reachable on foot. Find groups of places joined by paths; anything outside the main group gets no directions.
nbr = {p["id"]: set() for p in places}
for a, b in paths: nbr[a].add(b); nbr[b].add(a)
groups, left = [], set(nbr)
while left:
    todo, grp = [left.pop()], set()
    while todo:
        x = todo.pop(); grp.add(x); todo += [y for y in nbr[x] if y in left]; left -= nbr[x]
    groups.append(grp)
main = next((g for g in groups if "main_gate" in g), max(groups, key=len)) if groups else set()
for g in groups:
    if g is main: continue
    named = sorted(items[x]["name"] for x in g if x in items and items[x]["kind"] != "Bend")
    if not named: continue   # a separate bit of road or a lone bend with no place on it does not matter
    if len(g) == 1: problems.append(f"{named[0]}: no path to any other place")
    else: problems.append("Not joined to the " + ("Main Gate" if "main_gate" in main else "main") + " paths: " + ", ".join(named) + ". Walk from one of them to a place that is joined, with 'I walked here from' ticked")
# Shortcuts to walk: two places close together whose walking route (along saved paths only) is missing or more than DETOUR times
# the straight line. It never adds paths itself: only someone on the ground knows if a real path exists (no fence, building or gutter).
NEAR_M, DETOUR = 200, 2
byid = {p["id"]: p for p in places}
def route_m(src):  # walking distance from src to every place it can reach, like the app's route finder (Dijkstra)
    dist, heap = {src: 0.0}, [(0.0, src)]
    while heap:
        d, x = heapq.heappop(heap)
        if d > dist[x]: continue
        for y in nbr[x]:
            nd = d + metres(byid[x], byid[y])
            if nd < dist.get(y, math.inf): dist[y] = nd; heapq.heappush(heap, (nd, y))
    return dist
shown = [p for p in places if not p.get("hidden")]
shortcuts = []
for i, a in enumerate(shown):
    dist = None
    for b in shown[i + 1:]:
        m = metres(a, b)
        if m > NEAR_M: continue
        dist = dist or route_m(a["id"])
        r = dist.get(b["id"])
        if r is None or r > DETOUR * m: shortcuts.append((m, a["name"], b["name"], r))
# One place per line: still readable, but small enough for weak phones even with thousands of road points.
with open(os.path.join(out, "data", "places.json"), "w", encoding="utf-8") as fh:
    fh.write("[\n" + ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in places) + "\n]\n")
with open(os.path.join(out, "data", "paths.json"), "w", encoding="utf-8") as fh: json.dump(paths, fh)
print(f"Wrote {len(places)} places and {len(paths)} paths to {out}")
# Phones keep the old saved copy until the version in sw.js changes, so raise it on every run.
sw = os.path.join(out, "sw.js")
if os.path.exists(sw):
    with open(sw, encoding="utf-8") as fh: s = fh.read()
    m = re.search(r'const CACHE = "(.*?)(\d+)";', s)
    if m:
        ver = m.group(1) + str(int(m.group(2)) + 1)
        with open(sw, "w", encoding="utf-8", newline="\n") as fh: fh.write(s.replace(m.group(0), f'const CACHE = "{ver}";', 1))
        print("Raised the version in sw.js to", ver, "so phones fetch the new data")
print("\n".join(["Fix these:"] + problems) if problems else "No problems found.")
if shortcuts:
    print(f"\nShortcuts to walk ({len(shortcuts)}): these places are close, but the app has no sensible walking route between them.")
    print("Walk between each pair once with 'I walked here from' ticked, saving a Bend at every corner:")
    for m, a, b, r in sorted(shortcuts):
        print(f"  {a} <-> {b}: {round(m)} m apart, " + ("no route at all" if r is None else f"route now {round(r)} m"))
if show_list:  # the ids to use in field-fixes.json
    print("\nEvery place (id | name | category):")
    for p in sorted(shown, key=lambda p: p["name"].lower()):
        print(f"  {p['id']} | {p['name']} | {p.get('category', '')}")
