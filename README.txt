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
- "remove": ["my_test_place"]            drops a test entry and its paths.
- "change": {"faculty_of_pharmacy": {"name": "Faculty of Pharmacy", "category": "Faculties"}}
    Can set: name, category, aliases (a list), landmark, description, verified (true/false).
- Fixes are applied on every convert, so they are never lost when new field files arrive.
- Only labels can be fixed here. Weak GPS, missing paths and bends still need the Field team.

Test on your computer: npm start, then open http://localhost:8000
