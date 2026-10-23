OpenStreetMap data for OAU campus

oau-campus-osm.json is ONE saved copy of OpenStreetMap data (roads, footpaths and named places)
between the Main Gate and the northern halls. Refresh it rarely with:  python tools/fetch_osm.py

Licence: (c) OpenStreetMap contributors. The data is available under the Open Database License (ODbL 1.0):
https://www.openstreetmap.org/copyright

What this means for us:
- Every screen or map that uses it must say: (c) OpenStreetMap contributors
- data/places.json and data/paths.json mix our field data with OSM road points (ids starting osm_).
  That combined data is shared under the same ODbL licence, which our public repo already does.
- The app never contacts OpenStreetMap servers. Only tools/fetch_osm.py downloads, once.
