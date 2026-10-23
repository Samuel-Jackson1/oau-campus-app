# Compares our field places with OpenStreetMap's named places.
#     python tools/compare_osm.py                 (uses data/places.json and osm/oau-campus-osm.json)
#     python tools/compare_osm.py --near faculty_of_computing_science_and_engineering --radius 350
# For each field place it finds the OSM place with the most similar name nearby and says how far apart they are.
# With --near it also lists OSM places around that place which the Field team has not collected yet.
import difflib, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
opt = lambda name, default: args[args.index(name) + 1] if name in args else default
PLACES = opt("--places", os.path.join(ROOT, "data", "places.json"))
OSM = opt("--osm", os.path.join(ROOT, "osm", "oau-campus-osm.json"))
NEAR, RADIUS = opt("--near", None), float(opt("--radius", "350"))

def metres(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))

STOP = {"of", "the", "and", "oau", "building", "block", "university"}
# Words found in many names prove nothing on their own ("Walkway" is not "Social Science Walkway").
GENERIC = {"hall", "walkway", "office", "centre", "center", "room", "lecture", "theatre", "faculty", "department",
           "road", "junction", "bus", "stop", "park", "library", "college", "station", "lab", "laboratory", "area",
           "first", "second", "third", "main", "new", "old", "to"}
def words(s):
    return [w for w in re.sub(r"[^a-z0-9 ]", " ", s.lower()).split() if w not in STOP]
def distinctive(s):
    return {w for w in words(s) if w not in GENERIC and len(w) > 1 and not w.isdigit()}
def seq(a, b):
    return difflib.SequenceMatcher(None, " ".join(words(a)), " ".join(words(b))).ratio()
def similar(a, b):
    """(score, coverage): score >= 0.65 means a likely match; coverage breaks ties (how much of BOTH names is shared)."""
    if not words(a) or not words(b): return (0.0, 0.0)
    da, db, s = distinctive(a), distinctive(b), seq(a, b)
    if not da or not db or not (da & db):                       # only common words, or no distinctive word in common
        return (s, s) if s >= 0.85 else (0.0, 0.0)              # must then match almost exactly (HSLT vs HSLTA passes)
    shared = len(da & db)
    return (max(shared / min(len(da), len(db)), s), shared / max(len(da), len(db)))

places = [p for p in json.load(open(PLACES, encoding="utf-8")) if not p.get("hidden")]
osm = []
for e in json.load(open(OSM, encoding="utf-8"))["elements"]:
    t = e.get("tags", {})
    if "name" not in t or "highway" in t: continue   # roads are used for the walking network, not compared here
    c = e.get("center") or ({"lat": e["lat"], "lon": e["lon"]} if "lat" in e else None)
    if c: osm.append({"name": t["name"], "pos": (c["lat"], c["lon"]), "kind": t.get("amenity") or t.get("building") or t.get("leisure") or t.get("shop") or "place"})

print("FIELD PLACE vs OPENSTREETMAP (best name match within 400 m)")
print(f"{'Field place':<46} {'OpenStreetMap name':<40} {'apart':>6}  verdict")
matched = set()
for p in sorted(places, key=lambda p: p["name"].lower()):
    pos = (p["lat"], p["lng"])
    names = [p["name"]] + p.get("aliases", [])
    # Rank by: best similarity over name and nicknames, then similarity of the official name, then nearest.
    # (A nickname like "Moremi" matches "Moremi Car Park" as well as "Moremi Hall"; the official name breaks the tie.)
    limit = 400 if distinctive(p["name"]) else 100            # "Walkway" alone only counts if it is very close
    ranked = [((*max(similar(n, o["name"]) for n in names), seq(p["name"], o["name"]), -metres(pos, o["pos"])), o)
              for o in osm if metres(pos, o["pos"]) <= limit]
    key, o = max(ranked, key=lambda x: x[0], default=((0,), None))
    score = key[0]
    if o is None or score < 0.65:
        print(f"{p['name'][:45]:<46} {'(no similar name in OSM)':<40} {'':>6}  OSM does not know it: our field data is the only source")
        continue
    d = metres(pos, o["pos"]); matched.add(o["name"])
    verdict = "same place, positions agree" if d <= 60 else "same name but far apart: re-check position" if d > 150 else "close; OSM point is the building centre"
    print(f"{p['name'][:45]:<46} {o['name'][:39]:<40} {round(d):>4} m  {verdict}")

if NEAR:
    centre = next((p for p in places if p["id"] == NEAR), None)
    if not centre: sys.exit(f"--near: no place with id '{NEAR}'")
    cpos = (centre["lat"], centre["lng"])
    print(f"\nOPENSTREETMAP PLACES WITHIN {int(RADIUS)} m OF {centre['name'].upper()} THAT WE HAVE NOT COLLECTED")
    near = sorted((metres(cpos, o["pos"]), o) for o in osm if o["name"] not in matched and metres(cpos, o["pos"]) <= RADIUS)
    for d, o in near:
        print(f"  {round(d):>4} m  {o['name']}  ({o['kind']})")
    if not near: print("  none")
print("\nOpenStreetMap data © OpenStreetMap contributors (ODbL).")
