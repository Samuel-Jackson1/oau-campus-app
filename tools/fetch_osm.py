# Downloads ONE copy of OpenStreetMap data for OAU campus into osm/oau-campus-osm.json.
# Run it rarely (for example once per phase), never from the app: the public servers are shared and often busy.
#     python tools/fetch_osm.py
# Data © OpenStreetMap contributors, licensed under the ODbL (https://www.openstreetmap.org/copyright).
import json, os, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "osm", "oau-campus-osm.json")
BBOX = "7.490,4.505,7.530,4.540"   # south, west, north, east: Main Gate to the northern halls
QUERY = f"""[out:json][timeout:120];
way["highway"]["highway"!~"^(motorway|trunk|construction|proposed|raceway|bus_guideway)$"]["foot"!="no"]["access"!~"^(no|private)$"]({BBOX});
out body geom;
(way["name"]({BBOX}); node["name"]({BBOX}););
out tags center;"""
SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]

def fetch():
    body = urllib.parse.urlencode({"data": QUERY}).encode()
    wait = 10
    for attempt in range(4):
        for url in SERVERS:
            try:
                req = urllib.request.Request(url, data=body, headers={"User-Agent": "OAU-SWEP-campus-navigator/1.0 (student project, one-off download)"})
                data = urllib.request.urlopen(req, timeout=150).read()
                if data.lstrip().startswith(b"{"): return json.loads(data)
                print(url, "busy:", data[:60])
            except Exception as e:
                print(url, "failed:", e)
        print(f"All servers busy, waiting {wait} s ..."); time.sleep(wait); wait *= 2
    sys.exit("Could not download OpenStreetMap data. Try again later.")

d = fetch()
d["_source"] = "© OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright). Downloaded with tools/fetch_osm.py."
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh: json.dump(d, fh, ensure_ascii=False, separators=(",", ":"))
ways = sum(1 for e in d["elements"] if e["type"] == "way" and "geometry" in e)
print(f"Saved {OUT}: {ways} roads/paths and {len(d['elements']) - ways} named features ({os.path.getsize(OUT) // 1024} KB)")
