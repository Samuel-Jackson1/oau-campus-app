# DEV NOTES: Phase 1 (Tier 1 only)

## What this build contains
Directory with nicknames, browse by category, place photo slot and landmark, one-step-at-a-time landmark directions with a markers map, emergency categories with tap-to-call, "Where am I?", "Stay safe" slides (4 drafts), offline saving, three-language screens (drafts).

## NOT in this build (Tier 2 and 3 are parked)
Route lines on the map, voice and audio clips, live arrow or tracking, text/share/online alerts, responder dashboard, room finder, fresher mode, favourites, closed-path rule, campus notices. Do not add these in Phase 1.

## Simulated now (replace with real data; the yellow DEV bar disappears when no place has "sample": true)
- data/places.json and data/paths.json: sample places. Real ones come from the Collector (collect.html) through collector_to_data.py.
- Photos: placeholders until real photos arrive.
- data/emergency.json: only 112 is filled in. Add campus numbers ONLY after calling each office.
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

## Rules
- After ANY change, raise the version number at the top of sw.js.
- Category names are fixed: Lecture Theatres, Faculties, Hostels, Libraries, Administration, Essential Services, Gates, Food & Shops, Sports. Icons and translations depend on the spelling.
