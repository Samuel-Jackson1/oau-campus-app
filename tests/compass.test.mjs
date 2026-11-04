// The compass must give the same direction however the phone is held: flat, upright like taking a photo, or
// tilted. Android can report the same upright pose with different angle sets; all of them must agree.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const body = src.slice(src.indexOf("function compassOf"), src.indexOf("function onTurn"));
globalThis.window = {};
const make = angle => { globalThis.screen = {orientation: {angle}}; return new Function(body + "; return compassOf;")(); };
const near = (got, want) => assert.ok(Math.abs(((got - want + 540) % 360) - 180) < 1, `got ${got}, want ${want}`);

test("a flat phone points where its top edge points", () => {
  const c = make(0);
  near(c({alpha: 270, beta: 0, gamma: 0, absolute: true}), 90);
  near(c({alpha: 0, beta: 0, gamma: 0, absolute: true}), 0);
});

test("an upright phone points where its back camera looks, whichever angles Android reports", () => {
  const c = make(0);
  near(c({alpha: 270, beta: 90, gamma: 0, absolute: true}), 90);
  near(c({alpha: 0, beta: 90, gamma: -90, absolute: true}), 90);   // same pose: using alpha alone would say 0 (north)
  near(c({alpha: 90, beta: 90, gamma: 180, absolute: true}), 90);
});

test("a tilted phone, and one leaning back, still point ahead", () => {
  const c = make(0);
  near(c({alpha: 270, beta: 45, gamma: 0, absolute: true}), 90);
  near(c({alpha: 270, beta: 120, gamma: 0, absolute: true}), 90);
});

test("no direction from a compass that is not tied to north, and the iPhone reading is used as it is", () => {
  const c = make(0);
  assert.equal(c({alpha: 270, beta: 0, gamma: 0, absolute: false}), null);
  near(c({webkitCompassHeading: 135}), 135);
});

test("a phone held sideways uses the top of the screen", () => {
  near(make(90)({alpha: 0, beta: 0, gamma: 0, absolute: true}), 90);
});
