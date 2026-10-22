# Tests for collector_to_data.py. Run:  python tests/test_converter.py   (or: npm test)
# Each test writes pretend field files into a temporary folder, runs the converter, and checks the result.
import json, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
CONVERTER = os.path.join(HERE, "..", "collector_to_data.py")
PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="


def place(id, name, lat, lng, link="", cat="Gates", **extra):
    return {"id": id, "name": name, "kind": "Place", "by": "t", "lat": lat, "lng": lng, "acc": 8, "photo": PHOTO,
            "linkTo": link, "category": cat, "aliases": "", "landmark": "", "description": "", **extra}


def bend(id, n, lat, lng, link=""):
    return {"id": id, "name": f"Bend {n}", "kind": "Bend", "by": "t", "lat": lat, "lng": lng, "acc": 8, "photo": "", "linkTo": link}


class ConverterTest(unittest.TestCase):
    def run_converter(self, phones, sw_version=None):
        """phones: list of (device, exportedAt, items, links or None). Returns (places by id, paths, printed text)."""
        tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(tmp, "field"))
        for dev, at, items, links in phones:
            body = {"by": "t", "device": dev, "exportedAt": at, "items": items}
            if links is not None:
                body["links"] = links
            with open(os.path.join(tmp, "field", f"field-{dev}-{at[11:13]}.json"), "w", encoding="utf-8") as f:
                json.dump(body, f)
        if sw_version:
            with open(os.path.join(tmp, "sw.js"), "w", encoding="utf-8") as f:
                f.write(f'const CACHE = "{sw_version}";\n')
        res = subprocess.run([sys.executable, CONVERTER, os.path.join(tmp, "field"), "--out", tmp],
                             capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(res.returncode, 0, res.stderr)
        with open(os.path.join(tmp, "data", "places.json"), encoding="utf-8") as f:
            places = {p["id"]: p for p in json.load(f)}
        with open(os.path.join(tmp, "data", "paths.json"), encoding="utf-8") as f:
            paths = {frozenset(p) for p in json.load(f)}
        self.tmp = tmp
        return places, paths, res.stdout

    def test_old_files_bends_from_two_phones_are_kept_apart(self):
        # Old Collector: both phones call their own corner "bend_1".
        a = [place("main_gate", "Main Gate", 7.512, 4.520), bend("bend_1", 1, 7.513, 4.521, "main_gate"),
             place("library", "Library", 7.517, 4.5235, "bend_1", "Libraries")]
        b = [place("main_gate", "Main Gate", 7.512, 4.520), bend("bend_1", 1, 7.510, 4.515, "main_gate"),
             place("health_centre", "Health Centre", 7.514, 4.519, "bend_1", "Essential Services")]
        places, paths, _ = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", a, None), ("bbbb", "2026-10-22T10:00:00Z", b, None)])
        self.assertEqual(places["bend_aaaa_1"]["lat"], 7.513)
        self.assertEqual(places["bend_bbbb_1"]["lat"], 7.510)
        self.assertIn(frozenset(("bend_aaaa_1", "library")), paths)
        self.assertIn(frozenset(("bend_bbbb_1", "health_centre")), paths)
        self.assertNotIn(frozenset(("bend_bbbb_1", "library")), paths)

    def test_saving_a_place_again_keeps_its_earlier_paths(self):
        # New Collector: Gate -> Library -> Senate, back to Library (saved again), then Library -> Spider Building.
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("senate_building", "Senate Building", 7.5185, 4.5245, "library", "Administration"),
                 place("library", "Library", 7.517, 4.5235, "senate_building", "Libraries"), place("spider_building", "Spider Building", 7.520, 4.5225, "library", "Faculties")]
        links = [["main_gate", "library"], ["library", "senate_building"], ["library", "spider_building"]]
        places, paths, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, links)])
        self.assertEqual(paths, {frozenset(l) for l in links})
        self.assertIn("No problems found.", out)

    def test_two_phones_saving_the_same_place_keep_both_paths(self):
        a = [place("bus_stop", "Bus Stop", 7.513, 4.5215), place("main_gate", "Main Gate", 7.512, 4.520, "bus_stop")]
        b = [place("main_gate", "Main Gate", 7.5121, 4.5201), place("health_centre", "Health Centre", 7.514, 4.519, "main_gate", "Essential Services")]
        places, paths, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", a, [["bus_stop", "main_gate"]]),
                                                ("bbbb", "2026-10-22T10:00:00Z", b, [["main_gate", "health_centre"]])])
        self.assertEqual(paths, {frozenset(("bus_stop", "main_gate")), frozenset(("main_gate", "health_centre"))})
        self.assertEqual(places["main_gate"]["lat"], 7.5121)  # newest save wins for the position
        self.assertIn("No problems found.", out)

    def test_only_the_newest_file_from_each_phone_is_used(self):
        old = [place("main_gate", "Main Gate", 7.512, 4.520), place("wrong_place", "Wrong Place", 7.513, 4.521, "main_gate")]
        new = [place("main_gate", "Main Gate", 7.512, 4.520)]
        places, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", old, [["main_gate", "wrong_place"]]),
                                            ("aaaa", "2026-10-22T11:00:00Z", new, [])])
        self.assertNotIn("wrong_place", places)
        self.assertIn("Ignoring older file", out)

    def test_islands_are_reported(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("bus_stop", "Bus Stop", 7.513, 4.5215, "main_gate"),
                 place("moremi_hall", "Moremi Hall", 7.521, 4.520, "", "Hostels"), place("awolowo_hall", "Awolowo Hall", 7.516, 4.5275, "moremi_hall", "Hostels")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "bus_stop"], ["moremi_hall", "awolowo_hall"]])])
        self.assertIn("Not joined to the Main Gate paths: Awolowo Hall, Moremi Hall", out)

    def test_not_sure_places_are_unverified_and_listed(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("canteen", "Canteen", 7.5186, 4.523, "main_gate", "Food & Shops", unsure=True)]
        places, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "canteen"]])])
        self.assertFalse(places["canteen"]["verified"])
        self.assertTrue(places["main_gate"]["verified"])
        self.assertIn("Canteen: marked 'not sure'", out)

    def test_photos_are_saved_and_sw_version_is_raised(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520)]
        places, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [])], sw_version="oau-navigator-v7")
        self.assertEqual(places["main_gate"]["photo"], "images/places/main_gate.jpg")
        self.assertTrue(os.path.exists(os.path.join(self.tmp, "images", "places", "main_gate.jpg")))
        with open(os.path.join(self.tmp, "sw.js"), encoding="utf-8") as f:
            self.assertIn('const CACHE = "oau-navigator-v8";', f.read())

    def test_bad_category_and_missing_photo_are_listed(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520, photo=""), place("bank", "Bank", 7.513, 4.521, "main_gate", "Banks")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "bank"]])])
        self.assertIn("Main Gate: no photo", out)
        self.assertIn("Bank: category 'Banks' is not on the list", out)


if __name__ == "__main__":
    unittest.main(verbosity=2)
