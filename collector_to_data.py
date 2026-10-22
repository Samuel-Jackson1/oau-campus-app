# Turns the files sent from collect.html into the app's data files and photos.
# Put ALL the received field-*.txt files (older Collector versions sent field-*.json; both work) in one folder (example: field-files), then run from the app folder:
#     python collector_to_data.py field-files --out .
# Writes data/places.json, data/paths.json and images/places/*, raises the version in sw.js, and lists anything to fix.
# Drop EVERY file you receive into the folder. For each phone the program uses only its NEWEST file (a file already holds everything that phone saved),
# then merges all phones together. If a place appears twice, the newest save wins, but every path walked to or from it is kept.
# NOTE: data/places.json is rebuilt from the field files every time. Fix mistakes on the phone and re-send, not by editing places.json.
# At the end it also prints "Shortcuts to walk": close places whose walking route is missing or far too long. Send that list to Field Data.
import base64, datetime, glob, heapq, json, math, os, re, sys
args = sys.argv[1:]; out = "."
if "--out" in args: i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
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
label = lambda pid: items[pid]["name"]
for g in groups:
    if g is main: continue
    if len(g) == 1: problems.append(f"{label(next(iter(g)))}: no path to any other place")
    else: problems.append("Not joined to the " + ("Main Gate" if "main_gate" in main else "main") + " paths: " + ", ".join(sorted(label(x) for x in g)) + ". Walk from one of them to a place that is joined, with 'I walked here from' ticked")
# Shortcuts to walk: two places close together whose walking route (along saved paths only) is missing or more than DETOUR times
# the straight line. It never adds paths itself: only someone on the ground knows if a real path exists (no fence, building or gutter).
NEAR_M, DETOUR = 200, 2
def metres(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a["lat"], a["lng"], b["lat"], b["lng"]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
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
with open(os.path.join(out, "data", "places.json"), "w", encoding="utf-8") as fh: json.dump(places, fh, ensure_ascii=False, indent=1)
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
