# Data Format (Day 1 handoff from Back End)

**For:** Field Data team and Front End team
**Status:** DRAFT. Confirm in the first hour, then it is frozen. After that, any change must be agreed in the group chat first.

All app data lives in three files in the `data/` folder:

| File | What it holds | Who fills it |
|---|---|---|
| `places.json` | Every place on the map, plus the list of pilot zones | Field Data collects, Back End loads |
| `categories.json` | The category buttons (Lecture Theatres, Hostels...) | Back End; Design adds icons |
| `contacts.json` | Emergency phone numbers | Safety Content confirms, Back End loads |

---

## 1. One place: the fields

| Field | Required? | Example | Rules |
|---|---|---|---|
| `id` | yes | `moremi-hall` | lowercase, words joined by `-`, never changes once set. Leave blank in the spreadsheet and it is made from the name. |
| `name` | yes | `Moremi Hall` | the **official** name |
| `nicknames` | yes (can be empty) | `["Moremi"]` | what students actually call it. Two places must never share a nickname. |
| `category` | yes | `hostel` | must be an `id` from `categories.json` (list below) |
| `zone` | yes | `hostels` | must be one of the pilot zones (list below) |
| `landmark` | yes | `Opposite the Sports Complex` | the nearest thing everyone recognises |
| `description` | yes | `Female hall of residence.` | 1 or 2 short sentences |
| `coordinates` | yes | `{ "lat": 7.5210, "lng": 4.5205 }` | decimal numbers, 4+ decimal places. See "How to get coordinates". |
| `photo` | yes | `images/places/moremi-hall.jpg` | file name = the id. See "Photos". Use `null` until a photo exists. |
| `directionsFromMainGate` | yes | `["Walk straight past the bank", "Turn left at..."]` | short landmark steps, one action per step, in order |
| `verified` | yes | `true` / `false` | `true` ONLY after someone checked it in person |
| `checkedBy` | if verified | `Ade O.` | who checked it on the ground |
| `checkedOn` | if verified | `2026-10-22` | date checked, written YYYY-MM-DD |
| `sample` | no | `true` | marks made-up test entries. All of these are deleted before the Day 4 freeze. |

Full example in JSON:

```json
{
  "id": "moremi-hall",
  "name": "Moremi Hall",
  "nicknames": ["Moremi"],
  "category": "hostel",
  "zone": "hostels",
  "landmark": "Opposite the Sports Complex",
  "description": "Female hall of residence.",
  "coordinates": { "lat": 7.5210, "lng": 4.5205 },
  "photo": "images/places/moremi-hall.jpg",
  "directionsFromMainGate": ["Step 1", "Step 2", "Step 3"],
  "verified": true,
  "checkedBy": "Ade O.",
  "checkedOn": "2026-10-22"
}
```

(The landmark, description and coordinates above only show the format. They are not checked facts.)

### Category ids

`lecture-theatre`, `faculty`, `hostel`, `library`, `admin`, `health`, `security`, `gate`, `transport`, `bank`, `food`, `printing`, `sports`

Need a new category? Ask Back End to add it to `categories.json` first.

### Pilot zone ids (suggested; confirm in the first hour)

`gate-and-bus-stops`, `central-academic`, `health-centre-area`, `hostels`

---

## 2. For the Field Data team: how to send places

You do **not** need to write JSON.

1. Open `field/places-template.csv` in Google Sheets or Excel (or copy its header row into a shared Google Sheet).
2. Fill **one row per place**:
   - `nicknames`: separate them with `;`, for example `LT2; LT 2`
   - `directions_from_main_gate`: separate the steps with `|`, for example `Walk straight | Turn left at the bank | It is on your right`
   - `verified`: `yes` or `no`
   - `checked_by` and `checked_on`: fill these only if `verified` is `yes`
3. Download it as CSV (Google Sheets: File > Download > Comma-separated values) and drop it in the shared folder.
4. Back End imports it with one command and runs the checker.

**How to get coordinates:** stand at the building's main entrance, open Google Maps, long-press your blue dot (or the building), and copy the two numbers shown, for example `7.52103, 4.52051`. The first number is **latitude** and the second is **longitude**. The checker catches numbers that are swapped or outside OAU.

**Photos:** take a landscape photo of the entrance that shows a recognisable feature. Name it after the place id (`moremi-hall.jpg`). Keep it under 200 KB (about 800 px wide) so the app stays light on data.

**Not sure about something?** Put `no` in `verified`. A place that isn't verified can still be shown, but it is labelled as such.

---

## 3. Emergency contacts (`contacts.json`)

| Field | Example | Rules |
|---|---|---|
| `id` | `campus-security` | lowercase-with-dashes |
| `name` | `OAU Campus Security` | |
| `phone` | `"0803 000 0000"` or `null` | digits, spaces and an optional `+` only. `null` until known. |
| `emergency` | `security` | one of `medical`, `fire`, `security`, `general` |
| `status` | `to-be-confirmed` | becomes `confirmed` only after a team member has called the number |
| `confirmedBy`, `confirmedOn` | `Tolu A.`, `2026-10-21` | required when `confirmed` |

The app only shows a "Call" button for **confirmed** numbers. Never use a number copied from the internet.

---

## 4. For the Front End team: how to use the data

```js
import * as data from './js/data.js';

await data.loadData();                        // once, when the app starts

data.searchPlaces('lt2');                     // [{ place, score, matchedOn }], best first
data.searchPlaces('hall', { category: 'hostel' });
data.getCategories();                         // category buttons, in display order
data.getPlacesInCategory('lecture-theatre');  // A to Z list for browsing
data.getPlace('moremi-hall');                 // one place (or null)
data.getZones();                              // pilot zones
data.getContacts();                           // emergency contacts
data.isSampleData();                          // true while sample entries remain
```

- `matchedOn` tells you why a result matched, e.g. `nickname "LT2"`. You can show "Also known as LT2" with it.
- Search ignores capitals, spaces and dashes (`LT-2` = `lt 2` = `LT2`) and forgives one typo (`librery` finds Library).
- Show a "not verified" label on places where `verified` is `false`.
- See `data-test.html` for a working example of every function.
