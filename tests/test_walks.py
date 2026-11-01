"""Tests for tools/walks_report.py: run with  python tests/test_walks.py"""
import json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools"))
import walks_report as wr

T0 = 1793000000000
KNOWN = [{"id": "motion_ground", "name": "Motion Ground", "lat": 7.5180, "lng": 4.5227, "verified": True}]


def line(start_lat, start_lng, n, step_lat=0.0001, seconds=15, t0=T0, acc=8):
    """A straight walk: about 11 m every step."""
    return [[round(start_lat + i * step_lat, 6), start_lng, acc, t0 + i * seconds * 1000] for i in range(n)]


def walk(device, points, marks=(), wid="w1"):
    return {"device": device, "id": wid, "points": points, "marks": list(marks)}


class WalksTest(unittest.TestCase):
    def test_a_path_needs_three_different_phones(self):
        shared = line(7.51, 4.52, 20)
        walks = [walk("a", shared), walk("b", shared), walk("c", shared), walk("a", line(7.53, 4.53, 10), wid="w2")]
        r = wr.analyse(walks, KNOWN)
        self.assertGreater(len(r["paths"]["3"]), 0)
        self.assertGreater(len(r["paths"]["1"]), 0)   # the detour only one phone walked stays apart
        self.assertEqual(r["phones"], 3)

    def test_weak_gps_and_rides_are_left_out(self):
        weak = line(7.51, 4.52, 10, acc=80)
        self.assertEqual(wr.clean(weak), [])
        ride = line(7.51, 4.52, 10, step_lat=0.002, seconds=5)   # about 44 m a second
        self.assertLessEqual(len(wr.clean(ride)), 1)

    def test_a_long_stop_is_found(self):
        pts = line(7.51, 4.52, 5) + [[7.51045, 4.52, 8, T0 + 75000 + i * 60000] for i in range(5)] + line(7.5106, 4.52, 5, t0=T0 + 400000)
        stops = wr.find_stops(wr.clean(pts))
        self.assertEqual(len(stops), 1)
        self.assertGreaterEqual(stops[0]["minutes"], 2)

    def test_a_gps_gap_that_comes_back_nearby_is_found_but_a_far_one_is_not(self):
        near = [[7.51, 4.52, 8, T0], [7.5102, 4.52, 8, T0 + 300000]]
        far = [[7.51, 4.52, 8, T0], [7.53, 4.52, 8, T0 + 900000]]
        self.assertEqual(len(wr.find_gaps(near)), 1)
        self.assertEqual(wr.find_gaps(far), [])

    def test_a_wide_place_gets_a_size_from_many_phones_and_a_small_one_does_not(self):
        spots = [(7.5180, 4.5227), (7.5188, 4.5227), (7.5172, 4.5227), (7.5180, 4.5235), (7.5180, 4.5219)]
        marks = [{"mark": True, "place": "motion_ground", "name": "Motion Ground", "t": T0, "lat": a, "lng": b, "acc": 8} for a, b in spots]
        walks = [walk(d, line(7.51, 4.52, 3), [marks[i]]) for i, d in enumerate("abcde")]
        r = wr.analyse(walks, KNOWN)
        self.assertGreaterEqual(r["places"][0]["suggest_radius"], 40)
        tight = [{"mark": True, "place": "motion_ground", "name": "Motion Ground", "t": T0, "lat": 7.5180 + i * 1e-5, "lng": 4.5227, "acc": 8} for i in range(5)]
        r = wr.analyse([walk(d, line(7.51, 4.52, 3), [tight[i]]) for i, d in enumerate("abcde")], KNOWN)
        self.assertNotIn("suggest_radius", r["places"][0])

    def test_a_mark_with_no_gps_is_placed_from_the_walk(self):
        pts = line(7.51, 4.52, 5)
        m = {"mark": True, "place": "motion_ground", "name": "Motion Ground", "t": T0 + 30000}
        r = wr.analyse([walk("a", pts, [m])], KNOWN)
        self.assertEqual(r["places"][0]["picks"], 1)
        self.assertAlmostEqual(r["places"][0]["lat"], 7.5102, places=3)
        lost = {"mark": True, "name": "New Shop", "t": T0 + 99999999}
        r = wr.analyse([walk("a", pts, [lost])], KNOWN)
        self.assertEqual(r["places"][0]["unlocated"], 1)
        self.assertTrue(r["places"][0]["new"])

    def test_a_walk_sent_twice_counts_once_and_other_files_are_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            body = {"kind": "oau-walk", "device": "a", "walks": [{"id": "w1", "points": line(7.51, 4.52, 3), "marks": []}]}
            for name, content in (("one.txt", body), ("two.txt", body), ("collector.json", {"items": []})):
                with open(os.path.join(tmp, name), "w") as f:
                    json.dump(content, f)
            with open(os.path.join(tmp, "note.txt"), "w") as f:
                f.write("hello")
            self.assertEqual(len(wr.load(tmp)), 1)


if __name__ == "__main__":
    unittest.main()
