# DEV NOTES: Phase 1 (Tier 1 only)

## What this build contains
Directory with nicknames, browse by category, place photo slot and landmark, one-step-at-a-time landmark directions with a markers map, emergency categories with tap-to-call, "Where am I?", "Stay safe" slides (4 drafts), offline saving, three-language screens (drafts).

## Directions: OpenStreetMap roads + field data (v13)
- The converter builds the walking network from OpenStreetMap roads and footpaths (osm/), joins every field place to
  its nearest road, keeps short walked footpaths and replaces long straight walked lines with the real roads.
- route.js: faster route finder (heap), turns announced only at junctions and saved bends (not on road curves),
  and each turn names a known place within 80 m ("At Faculty of Pharmacy, turn left"). The step photo shows that place.
- The directions screen credits OpenStreetMap contributors (ODbL). Yoruba "Ní" and Pidgin "For" for "At" are drafts.
- In-app map (v16): drawn from our own data, works offline: OpenStreetMap roads (grey), walked footpaths (green dashes),
  every place as a dot, the route as a blue line, pins at both ends and at turn landmarks.
- Updates (v16): sw.js checks pages, code and data online first (3 s limit, then the saved copy), so a new version and
  the newest Collector form show on the next open with internet. Photos stay saved-copy-first.
- Light/dark switch (v16) in the header: follows the phone until tapped, then remembered.
- Focus for the presentation: Main Gate to the Faculty of Computing Science and Engineering. Full campus later.

## 3D look (v20)
- Landing page (first open, and the language button): floating 3D spheres say hello in each language (tap one to choose),
  with the same three languages in a readable row underneath. Pure CSS, no 3D library, so it stays light and works offline.
- Find, Stay safe and Emergency are now side-by-side pages: swipe left/right or tap the raised tab bar. In Chrome the pages
  turn like the sides of a cube while swiping; other browsers simply slide. Emergency is always one tap away in the tab bar.
- The search box has a travelling yellow edge and a pulsing dot to show it is live.
- Recent places: the last 6 places chosen, newest first, saved on the phone only (localStorage "recent"), with a Clear button.
- The Yoruba and Pidgin greetings ("Ẹ káàbọ̀!", "How far?") and the new words are drafts like the rest.
- Converter: ALL field files are combined (oldest first, newest save of a place wins), so a phone whose list was cleared
  between sends loses nothing. A place deleted on purpose needs a "remove" fix.

## NOT in this build (Tier 2 and 3 are parked)
Voice and audio clips, live arrow or tracking, text/share/online alerts, responder dashboard, room finder, fresher mode, favourites, closed-path rule, campus notices. Do not add these in Phase 1.

## Simulated now (replace with real data; the yellow DEV bar disappears when no place has "sample": true)
- data/places.json and data/paths.json: sample places. Real ones come from the Collector (collect.html) through collector_to_data.py.
- Photos: placeholders until real photos arrive.
- data/emergency.json: 112 and the Health Centre (+234 810 747 5862, given directly by the Health Centre team, 2026-10-22) are filled in. Campus fire service and campus security are still "to be confirmed". Add a number ONLY from the office itself, with "source" and "confirmedOn" (npm test checks this). Call every number again on Day 5.
- data/lessons.json: 4 DRAFT slides. Each must be reviewed by the office named in "reviewer".
- All Yoruba and Pidgin text is a first draft. Native speakers must check every line.

## Small Tier 1 gaps still open
- Show the short description text on the destination screen.
- Show the optional "from the gate" text (the Collector does not collect it, the sheet does).
- A single-place "Show on map" button.

## Needs a real phone
- Collector photo shrinking and GPS.
- Offline in airplane mode, Android and iPhone.
- A phone that blocks storage, and an old phone.

## Collector and converter fixes (v8)
- Bends now get an id with the phone's code (bend_<phone>_<n>), so "Bend 1" from two phones never merge. Older files are fixed the same way by the converter.
- Walked paths are kept in their own "links" list. Saving a place again (to branch off from it) keeps every path walked before; so does the same place saved on two phones.
- New "I am not sure about this one" box: the place is saved as not verified, stays hidden in the app, and appears in the converter's "Fix these" list.
- The converter reports groups of places that are not joined to the Main Gate paths, and raises the sw.js version on every run.
- data/places.json is rebuilt from the field files on every run: fix mistakes on the phone and re-send, not by editing places.json.
- Tests: npm test (route.js + the data in data/, and the converter).

## Category icons (v9)
- The group's own set (concepts by Timi, Front End), redrawn as single-colour line icons: icons/categories/*.svg.
- No circle and no text inside the icon: the app draws the circle and shows the name in the chosen language.
- To change one: edit its SVG, run npm run icons (rebuilds category-icons.js), raise the sw.js version.

## Rules
- After ANY change, raise the version number at the top of sw.js.
- Category names are fixed: Lecture Theatres, Faculties, Hostels, Libraries, Administration, Essential Services, Gates, Food & Shops, Sports. Icons and translations depend on the spelling.
