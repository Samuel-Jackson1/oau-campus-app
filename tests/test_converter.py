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
    def run_converter(self, phones, sw_version=None, fixes=None, extra=(), osm=None):
        """phones: list of (device, exportedAt, items, links or None). Returns (places by id, paths, printed text)."""
        tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(tmp, "field"))
        if osm is not None:
            os.makedirs(os.path.join(tmp, "osm"))
            with open(os.path.join(tmp, "osm", "oau-campus-osm.json"), "w", encoding="utf-8") as f:
                json.dump(osm, f)
        if fixes is not None:
            with open(os.path.join(tmp, "field-fixes.json"), "w", encoding="utf-8") as f:
                json.dump(fixes, f)
        for dev, at, items, links in phones:
            body = {"by": "t", "device": dev, "exportedAt": at, "items": items}
            if links is not None:
                body["links"] = links
            with open(os.path.join(tmp, "field", f"field-{dev}-{at[11:13]}.json"), "w", encoding="utf-8") as f:
                json.dump(body, f)
        if sw_version:
            with open(os.path.join(tmp, "sw.js"), "w", encoding="utf-8") as f:
                f.write(f'const CACHE = "{sw_version}";\n')
        res = subprocess.run([sys.executable, CONVERTER, os.path.join(tmp, "field"), "--out", tmp, *extra],
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

    def test_txt_files_from_the_new_collector_are_read_and_other_files_skipped(self):
        tmp = tempfile.mkdtemp(); os.makedirs(os.path.join(tmp, "field"))
        body = {"by": "t", "device": "aaaa", "exportedAt": "2026-10-22T09:00:00Z",
                "items": [place("main_gate", "Main Gate", 7.512, 4.520)], "links": []}
        with open(os.path.join(tmp, "field", "field-t-aaaa.txt"), "w", encoding="utf-8") as f:
            json.dump(body, f)
        with open(os.path.join(tmp, "field", "notes.txt"), "w", encoding="utf-8") as f:
            f.write("walk the hostels on Friday")
        res = subprocess.run([sys.executable, CONVERTER, os.path.join(tmp, "field"), "--out", tmp], capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn("Skipping notes.txt", res.stdout)
        with open(os.path.join(tmp, "data", "places.json"), encoding="utf-8") as f:
            self.assertEqual([p["id"] for p in json.load(f)], ["main_gate"])

    def test_nothing_is_overwritten_when_no_file_is_a_field_file(self):
        tmp = tempfile.mkdtemp(); os.makedirs(os.path.join(tmp, "field")); os.makedirs(os.path.join(tmp, "data"))
        with open(os.path.join(tmp, "field", "notes.txt"), "w", encoding="utf-8") as f:
            f.write("not field data")
        with open(os.path.join(tmp, "data", "places.json"), "w", encoding="utf-8") as f:
            f.write('[{"id": "keep_me"}]')
        res = subprocess.run([sys.executable, CONVERTER, os.path.join(tmp, "field"), "--out", tmp], capture_output=True, text=True, encoding="utf-8")
        self.assertNotEqual(res.returncode, 0)
        with open(os.path.join(tmp, "data", "places.json"), encoding="utf-8") as f:
            self.assertIn("keep_me", f.read())

    def test_close_places_with_a_long_route_are_listed_as_shortcuts(self):
        # A and D are about 73 m apart, but the only walked path goes A -> B -> C -> D, nearly 1 km.
        items = [place("a", "Place A", 7.5120, 4.5200), place("b", "Place B", 7.5160, 4.5200, "a"),
                 place("c", "Place C", 7.5160, 4.52066, "b"), place("d", "Place D", 7.5120, 4.52066, "c")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["a", "b"], ["b", "c"], ["c", "d"]])])
        self.assertIn("Shortcuts to walk (1)", out)
        self.assertIn("Place A <-> Place D: 73 m apart, route now", out)
        self.assertNotIn("Place B <-> Place C", out)  # directly joined, so not listed

    def test_pairs_joined_through_a_bend_are_not_listed(self):
        items = [place("a", "Place A", 7.5120, 4.5200), bend("bend_aaaa_1", 1, 7.5120, 4.5204, "a"),
                 place("d", "Place D", 7.5124, 4.5204, "bend_aaaa_1")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["a", "bend_aaaa_1"], ["bend_aaaa_1", "d"]])])
        self.assertNotIn("Shortcuts to walk", out)

    def test_close_places_with_no_route_are_listed_and_far_ones_are_not(self):
        items = [place("a", "Place A", 7.5120, 4.5200), place("near", "Near Place", 7.5125, 4.5200),
                 place("far", "Far Place", 7.5200, 4.5200)]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [])])
        self.assertIn("Place A <-> Near Place: 56 m apart, no route at all", out)
        self.assertNotIn("Far Place <->", out)
        self.assertNotIn("<-> Far Place", out)

    def test_fixes_merge_a_duplicate_and_join_two_walks(self):
        # Two people saved the same building under different names, so their walks never met.
        a = [place("main_gate", "Main Gate", 7.4968, 4.5223), place("student_union_building", "Student union building", 7.51795, 4.52138, "main_gate", "Administration", aliases="SUB")]
        b = [place("sub", "SUB", 7.51801, 4.52135, "", "Food & Shops", aliases="Captain Cook"), place("moremi_hall", "Moremi Hall", 7.52032, 4.51865, "sub", "Hostels")]
        phones = [("aaaa", "2026-10-22T09:00:00Z", a, [["main_gate", "student_union_building"]]), ("bbbb", "2026-10-22T10:00:00Z", b, [["sub", "moremi_hall"]])]
        places, paths, out = self.run_converter(phones)
        self.assertIn("Not joined to the Main Gate paths", out)
        places, paths, out = self.run_converter(phones, fixes={"same_place": [{"keep": "student_union_building", "merge": "sub"}]})
        self.assertNotIn("sub", places)
        self.assertIn(frozenset(("student_union_building", "moremi_hall")), paths)  # Damilare's path now starts at the kept place
        self.assertNotIn("Not joined", out)
        self.assertEqual(places["student_union_building"]["lat"], 7.51795)  # the kept entry's position stays
        self.assertEqual(places["student_union_building"]["aliases"], ["SUB", "Captain Cook"])  # no "SUB" twice
        self.assertIn("Applied 1 fix(es)", out)

    def test_fixes_change_name_category_nicknames_and_verified(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("phe", "DEPARTMENT OF KINESIOLOGY", 7.5177, 4.5215, "main_gate", "Lecture Theatres", aliases="PHE, Sports dept", unsure=True)]
        fixes = {"change": {"phe": {"name": "Department of Kinesiology", "category": "Faculties", "aliases": ["PHE"], "verified": True}}}
        places, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "phe"]])], fixes=fixes)
        p = places["phe"]
        self.assertEqual((p["name"], p["category"], p["aliases"], p["verified"]), ("Department of Kinesiology", "Faculties", ["PHE"], True))
        self.assertNotIn("marked 'not sure'", out)

    def test_fixes_remove_a_test_entry_and_report_unknown_ids(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("my_test", "My Test", 7.513, 4.521, "main_gate")]
        fixes = {"remove": ["my_test"], "change": {"no_such_place": {"name": "X"}}, "same_place": [{"keep": "main_gate", "merge": "ghost"}]}
        places, paths, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "my_test"]])], fixes=fixes)
        self.assertNotIn("my_test", places)
        self.assertEqual(paths, set())
        self.assertIn("'no_such_place' (to change) is not in any field file", out)
        self.assertIn("'ghost' (to merge) is not in any field file", out)

    def test_list_option_prints_every_place_id(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520), place("moremi_hall", "Moremi Hall", 7.513, 4.521, "main_gate", "Hostels")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "moremi_hall"]])], extra=["--list"])
        self.assertIn("moremi_hall | Moremi Hall | Hostels", out)

    # A tiny pretend OpenStreetMap file: road 1 runs east (nodes 1-2-3), road 2 turns north at node 3 (a junction) to node 4.
    OSM = {"elements": [
        {"type": "way", "id": 10, "tags": {"highway": "service"}, "nodes": [1, 2, 3],
         "geometry": [{"lat": 7.5000, "lon": 4.5000}, {"lat": 7.5000, "lon": 4.5010}, {"lat": 7.5000, "lon": 4.5020}]},
        {"type": "way", "id": 11, "tags": {"highway": "footway"}, "nodes": [3, 4],
         "geometry": [{"lat": 7.5000, "lon": 4.5020}, {"lat": 7.5010, "lon": 4.5020}]}]}

    def test_osm_roads_join_places_and_replace_long_walked_lines(self):
        items = [place("a", "Place A", 7.5001, 4.5000), place("b", "Place B", 7.5010, 4.5021, "a"),
                 place("c", "Place C", 7.5002, 4.5003, "a")]
        phone = [("aaaa", "2026-10-22T09:00:00Z", items, [["a", "b"], ["a", "c"]])]
        places, paths, out = self.run_converter(phone, osm=self.OSM)
        self.assertTrue(places["osm_3"]["junction"])                  # used by two roads
        self.assertNotIn("junction", places["osm_2"])                 # only a point along a road
        self.assertTrue(places["osm_2"]["hidden"])
        self.assertIn(frozenset(("a", "osm_1")), paths)               # A joined to its nearest road point
        self.assertIn(frozenset(("b", "osm_4")), paths)
        self.assertNotIn(frozenset(("a", "b")), paths)                # 250 m straight guess replaced by real roads
        self.assertIn(frozenset(("a", "c")), paths)                   # short walked path kept
        self.assertIn("1 long walked lines (over 150 m) replaced by real roads", out)
        places, paths, out = self.run_converter(phone, osm=self.OSM, extra=["--no-osm"])
        self.assertIn(frozenset(("a", "b")), paths)
        self.assertNotIn("osm_1", places)

    def test_places_far_from_any_osm_road_keep_their_walked_lines(self):
        items = [place("a", "Place A", 7.5001, 4.5000), place("far", "Far Place", 7.5050, 4.5050, "a")]
        places, paths, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["a", "far"]])], osm=self.OSM)
        self.assertIn(frozenset(("a", "far")), paths)
        self.assertIn("only walked paths reach them: Far Place", out)

    def test_twins_listed_and_small_detours_ignored(self):
        # "Shop" 7 m from the library: maybe the same building. B is 30 m from the library, but the only route
        # (via Mid) is about 63 m: more than double, yet only ~33 m extra, too small to be worth a walk.
        items = [place("lib", "Library", 7.5120, 4.5200), place("shop", "Shop", 7.51206, 4.5200, "lib"),
                 place("b", "Place B", 7.51227, 4.5200), place("mid", "Mid", 7.51213, 4.52025, "lib")]
        links = [["lib", "mid"], ["mid", "b"]]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, links)])
        self.assertIn("Possibly the same place (1)", out)
        self.assertIn("Library <-> Shop: 7 m apart", out)
        self.assertNotIn("Library <-> Place B", out)

    def test_bad_category_and_missing_photo_are_listed(self):
        items = [place("main_gate", "Main Gate", 7.512, 4.520, photo=""), place("bank", "Bank", 7.513, 4.521, "main_gate", "Banks")]
        _, _, out = self.run_converter([("aaaa", "2026-10-22T09:00:00Z", items, [["main_gate", "bank"]])])
        self.assertIn("Main Gate: no photo", out)
        self.assertIn("Bank: category 'Banks' is not on the list", out)


if __name__ == "__main__":
    unittest.main(verbosity=2)
