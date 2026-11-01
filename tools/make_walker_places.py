"""Copies the place list into the OAU Walk Android app, so volunteers can pick their place with no data.

    python tools/make_walker_places.py
"""
import json, os

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
places = json.load(open(os.path.join(here, "data", "places.json"), encoding="utf-8"))
listed = [p for p in places if p.get("verified") and not p.get("hidden") and not p.get("waypoint")]
rows = [{"id": p["id"], "name": p["name"], "search": " ".join([p["name"]] + (p.get("aliases") or [])),
         "lat": round(p["lat"], 6), "lng": round(p["lng"], 6)} for p in sorted(listed, key=lambda p: p["name"].lower())]
out = os.path.join(here, "android-walker", "app", "src", "main", "assets", "places.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=0)
print(len(rows), "places ->", out)
