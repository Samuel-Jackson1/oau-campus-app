"""Copies the place list and the campus boundary into the OAU Walk Android app, so they work with no data.

    python tools/make_walker_places.py
"""
import json, os

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets = os.path.join(here, "android-walker", "app", "src", "main", "assets")
os.makedirs(assets, exist_ok=True)

with open(os.path.join(here, "data", "places.json"), encoding="utf-8") as f:
    places = json.load(f)
with open(os.path.join(here, "tools", "walker_extra_places.json"), encoding="utf-8") as f:
    extra = json.load(f)
listed = {p["id"]: p for p in places if p.get("verified") and not p.get("hidden") and not p.get("waypoint")}

also = {}
for name, pid in extra["same_as"].items():
    assert pid in listed, f"{name}: {pid} is not a saved place"
    also.setdefault(pid, []).append(name)

rows = [{"id": p["id"], "name": p["name"], "search": " ".join([p["name"]] + (p.get("aliases") or []) + also.get(p["id"], [])),
         "lat": round(p["lat"], 6), "lng": round(p["lng"], 6)} for p in listed.values()]
saved = {r["name"].lower() for r in rows}
for name in extra["new"]:
    assert name.lower() not in saved, f"{name} is already a saved place"
    rows.append({"name": name, "search": name})   # no id and no position yet: the picks will locate it
rows.sort(key=lambda r: r["name"].lower())
with open(os.path.join(assets, "places.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(rows, f, ensure_ascii=False, indent=0)

with open(os.path.join(here, "tools", "campus_boundary.json"), encoding="utf-8") as f:
    campus = json.load(f)
with open(os.path.join(assets, "campus.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"margin": campus["margin"], "ring": campus["ring"]}, f)
print(len(listed), "saved places +", len(extra["new"]), "new names,", len(extra["same_as"]), "other names for saved places ->", assets)
