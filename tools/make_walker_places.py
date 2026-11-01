"""Copies the place list and the campus boundary into the OAU Walk Android app, so they work with no data.

    python tools/make_walker_places.py
"""
import json, os

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets = os.path.join(here, "android-walker", "app", "src", "main", "assets")
os.makedirs(assets, exist_ok=True)

with open(os.path.join(here, "data", "places.json"), encoding="utf-8") as f:
    places = json.load(f)
listed = [p for p in places if p.get("verified") and not p.get("hidden") and not p.get("waypoint")]
rows = [{"id": p["id"], "name": p["name"], "search": " ".join([p["name"]] + (p.get("aliases") or [])),
         "lat": round(p["lat"], 6), "lng": round(p["lng"], 6)} for p in sorted(listed, key=lambda p: p["name"].lower())]
with open(os.path.join(assets, "places.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(rows, f, ensure_ascii=False, indent=0)

with open(os.path.join(here, "tools", "campus_boundary.json"), encoding="utf-8") as f:
    campus = json.load(f)
with open(os.path.join(assets, "campus.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"margin": campus["margin"], "ring": campus["ring"]}, f)
print(len(rows), "places and", len(campus["ring"]), "boundary points ->", assets)
