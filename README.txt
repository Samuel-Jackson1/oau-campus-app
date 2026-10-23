OAU Navigator, Phase 1 (Tier 1 only). Sample data.
1. Upload ALL files to a GitHub repository (index.html at the top level) and turn on GitHub Pages.
2. The Collector page for the field team is the same link ending in /collect.html.
3. Back End turns field files into data with: python collector_to_data.py field-files --out .
4. See DEV_NOTES.md.

Live app:       https://samuel-jackson1.github.io/oau-campus-app/
Collector page: https://samuel-jackson1.github.io/oau-campus-app/collect.html

Back End routine, each time field files arrive (needs Node.js and Python):
a. Save EVERY received field-*.txt file (older ones are .json) into the folder field-files (kept off GitHub on purpose).
b. npm run convert   (same as step 3; it also raises the version in sw.js)
c. Fix labels yourself in field-fixes.json (see below), run npm run convert again,
   then send what is left of "Fix these" and "Shortcuts to walk" to Field Data (things only a walk can fix).
d. npm test          (checks every place can be reached on foot from the Main Gate)
e. git add -A, git commit -m "Field data batch N", git push. The live link updates in about a minute.
f. Tell the chat.

Fixing names, categories and duplicates without re-walking (field-fixes.json):
- npm run convert -- --list   prints every place as  id | name | category.  Fixes always use the id.
- "same_place": [{"keep": "student_union_building", "merge": "sub"}]
    Two entries are one real place. The kept one keeps its position and photo; the other one's
    paths move to it and its name becomes a nickname. This is how two people's walks get joined.
- "not_same": [["ict", "seminar_room_a_and_b"]]
    Two entries under 15 m apart that ARE different places: the converter stops listing them as "possibly the same".
- "remove": ["my_test_place"]            drops a test entry and its paths.
- "change": {"faculty_of_pharmacy": {"name": "Faculty of Pharmacy", "category": "Faculties"}}
    Can set: name, category, aliases (a list), landmark, description, verified (true/false).
- Fixes are applied on every convert, so they are never lost when new field files arrive.
- Only labels can be fixed here. Weak GPS, missing paths and bends still need the Field team.

OpenStreetMap (OSM) roads + our field data (best of both):
- osm/oau-campus-osm.json is one saved copy of OSM roads, footpaths and named places (python tools/fetch_osm.py
  refreshes it, rarely). Credit: (c) OpenStreetMap contributors, ODbL. See osm/README.txt.
- npm run convert now uses OSM roads as the walking network: each field place is joined to its nearest road,
  short walked paths (150 m or less) are kept as footpath shortcuts, and long walked lines are replaced by the real
  roads (a long straight line between two saved points can cut through buildings). Add --no-osm to switch it off.
- Field data stays the source for places, names, photos, nicknames and landmarks. OSM gives the roads.
- python tools/compare_osm.py   compares our places with OSM's named places (position check).
  Add --near <id> --radius 350 to list OSM places near a place that we have not collected yet.
- Focus for now: the Faculty of Computing Science and Engineering area. Full campus coverage is a later phase.

Test on your computer: npm start, then open http://localhost:8000
