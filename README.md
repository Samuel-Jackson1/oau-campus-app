# OAU Campus Navigation & Emergency Assistance System

SWEP 200 group project. A free, phone-friendly web app that helps people find places on OAU campus and reach verified emergency contacts. Tier 1 scope only (see the Central Project Document).

There is no server to run in production. The data is stored in JSON files, the logic is JavaScript that runs in the phone's browser, and the whole folder is hosted for free on GitHub Pages.

## Folder layout

```
data/            places.json, categories.json, contacts.json  <- the app's data
js/data.js       loads the data and gives the screens simple functions
js/search.js     search logic (names, nicknames, typos)
index.html       home page (Front End replaces this)
data-test.html   Back End test page: proves data + search work
images/places/   place photos, named after the place id
field/           CSV template for the Field Data team
tools/           checker, CSV importer, local test server
tests/           automatic tests for search and the importer
DATA_FORMAT.md   the agreed data format (read this first)
PILOT_PLACES.md  the pilot zones and first place list
```

## Everyday commands

You need [Node.js](https://nodejs.org) (version 20 or newer). Nothing else needs installing. Run these from inside this folder:

| Command | What it does |
|---|---|
| `npm start` | starts a test server; open http://localhost:8000 |
| `npm test` | runs the search tests |
| `npm run validate` | checks the data files for mistakes |
| `npm run import-csv -- path/to/batch.csv` | adds a Field Data spreadsheet to `places.json` |

Do **not** open `index.html` by double-clicking it. The browser blocks the data files unless you use `npm start`.

## Loading a batch from Field Data

1. Save their CSV somewhere (e.g. `field/batch1.csv`).
2. `npm run import-csv -- field/batch1.csv`
3. `npm run validate` and fix every ERROR. WARNINGs are things not filled in yet.
4. Publish (commit and push). The live link updates in about a minute.

## Hosting

GitHub Pages serves this folder over HTTPS, which offline saving needs on Day 2. Settings > Pages > Deploy from branch > `main` / root.
