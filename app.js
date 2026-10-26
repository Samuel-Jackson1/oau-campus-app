// app.js: picture-first, one step at a time. Every screen word is translated in all 3 languages.
// All Yoruba and Pidgin lines are FIRST DRAFTS: native speakers must check them.
// Safe storage: some viewers (chat previews, sandboxes) block it. The app must still open.
const store = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
window.addEventListener("error", e => { const b = document.getElementById("status"); if (b) b.textContent = "Error: " + e.message + ". Please reload."; });
const S = {
  en: {find:"Find a place", sos:"Emergency", here:"Use my location", where:"Where are you now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search a place...", map:"See map", note:"This screen does not alert anyone. It helps you call and shows what to do.",
    nopath:"No walking route saved yet. Landmark:", pending:"Advice not yet confirmed.", tbc:"Number to be confirmed", arrived:"You have arrived",
    start:"Start by walking to", straight:"Go straight to", left:"Turn left towards", right:"Turn right towards", langname:"English", wai:"Where am I?", near:"You are near:", pickhere:"Pick where you are: ", allplaces:"Show all places", lessons:"Stay safe: what to do", draft:"First version. Being checked with", firstopen:"Turn on mobile data once. The app saves itself, then works without data.", saving:"Saving for offline use...", ready:"Ready to use without data", share:"Share my location", text:"Text with my location", online:"Send alert online", needdata:"Turn on mobile data to use this.", notyet:"Online alert is not set up yet. Please call or text.", lookfor:"Look for it on your way", photo:"Photo goes here", walk:"Demo walk", nolocation:"Could not find your location.", at:"At", theme:"Light or dark", tagline:"Find your way around OAU", tagsub:"Places, step-by-step directions and emergency help. Works without data.", recent:"Recent", clear:"Clear", tfind:"Find", tsafe:"Stay safe", aka:"Also called", closest:"No exact match. Closest places:", share:"Share this place", copied:"Link copied", longwalk:"Long walk. Carry water, and take a bus or keke if one is going your way.", noroute:"No route yet", fresh:"New to OAU? Freshers trail", freshsub:"The first places to find, in order", found:"found", go:"Go", fdraft:"Draft list and tips. The team must check them.", wheresub:"Let your phone find you, or tap a place you can see.", seeplace:"Or tap a place you can see", skip:"Skip for now", whereto:"Where do you want to go?", youat:"You are at", change:"Change", setwhere:"Tap to say where you are", you:"You", startpin:"Start", herecard:"You are here", showme:"Show me", following:"Following you", far:"Your phone says you are {d} away from this route. Directions start at {name}: walk there first, or pick where you are again.", whattodo:"What to do", follow:"Follow me", walkfor:"Walk", tleft:"Turn left", tright:"Turn right", tstraight:"Go straight on", stepn:"Step", finding:"Finding you...", nearby:"Near", going:"Going to", gpsnote:"Works without data", typename:"Type a name, or scroll", locdenied:"Location is off for this app. Turn it on in your browser settings, or pick where you are from the list.", loctimeout:"GPS is taking too long. Step outside or try again."},
  yo: {find:"Wá ibì kan", sos:"Pàjáwìrì", here:"Lo ibi tí mo wà", where:"Níbo ni o wà báyìí?", listen:"Gbọ́", live:"Ọfà ìtọ́sọ́nà",
    turn:"Yí fóònù rẹ", search:"Wá orúkọ ibì kan...", map:"Wo àwòrán ilẹ̀", note:"Èyí kò ní ránṣẹ́ sí ẹnikẹ́ni. Ó ń ràn ọ́ lọ́wọ́ láti pe ìrànwọ́, ó sì fi ohun tí o máa ṣe hàn ọ́.",
    nopath:"A kò tíì fi ọ̀nà pamọ́. Àmì ibi:", pending:"A kò tíì jẹ́rìí ìmọ̀ràn yìí.", tbc:"A ṣì ń jẹ́rìí nọ́ńbà náà", arrived:"O ti dé",
    start:"Bẹ̀rẹ̀ nípa rírìn lọ sí", straight:"Máa lọ tààrà sí", left:"Yà sí òsì sí", right:"Yà sí ọ̀tún sí", langname:"Yorùbá", wai:"Níbo ni mo wà?", near:"O wà nítòsí:", pickhere:"Yan ibi tí o wà: ", allplaces:"Fi gbogbo ibi hàn", lessons:"Dúró láìséwu: ohun tí o máa ṣe", draft:"Ẹ̀dà àkọ́kọ́. À ń yẹ̀ ẹ́ wò pẹ̀lú", firstopen:"Tan dátà alágbèéká rẹ lẹ́ẹ̀kan. Ohun èlò yìí yóò fi ara rẹ̀ pamọ́, yóò sì ṣiṣẹ́ láì lo dátà.", saving:"Ń fipamọ́ fún lílò láì lo dátà...", ready:"Ó ti ṣetán láti lò láì lo dátà", share:"Pín ibi tí mo wà", text:"Fi ọ̀rọ̀ ránṣẹ́ pẹ̀lú ibi tí mo wà", online:"Fi ìkìlọ̀ ránṣẹ́ lórí íntánẹ́ẹ̀tì", needdata:"Tan dátà alágbèéká rẹ láti lo èyí.", notyet:"A kò tíì ṣètò èyí. Jọ̀wọ́ pè tàbí fi ọ̀rọ̀ ránṣẹ́.", lookfor:"Wá a lójú ọ̀nà rẹ", photo:"Fọ́tò máa wà níbí", walk:"Ìrìn àyẹ̀wò", nolocation:"A kò rí ibi tí o wà.", at:"Ní", theme:"Ìmọ́lẹ̀ tàbí òkùnkùn", tagline:"Wá ọ̀nà rẹ ní OAU", tagsub:"Àwọn ibi, ìtọ́sọ́nà ní ìgbésẹ̀ kọ̀ọ̀kan, àti ìrànwọ́ pàjáwìrì. Ó ń ṣiṣẹ́ láì lo dátà.", recent:"Àwọn tí o wá láìpẹ́", clear:"Pa rẹ́", tfind:"Wá", tsafe:"Ààbò", aka:"A tún ń pè é ní", closest:"Kò sí èyí tó bá a mu gan-an. Àwọn tó súnmọ́ ọ:", share:"Pín ibí yìí", copied:"A ti da ìjápọ̀ kọ", longwalk:"Ìrìn jíjìn ni. Gbé omi dání, kí o sì wọ bọ́ọ̀sì tàbí kẹ̀kẹ́ tó bá ń lọ sí ọ̀nà rẹ.", noroute:"Kò sí ọ̀nà síbẹ̀", fresh:"Ṣé o ṣẹ̀ṣẹ̀ dé OAU? Ìtọ́sọ́nà akẹ́kọ̀ọ́ tuntun", freshsub:"Àwọn ibi àkọ́kọ́ tí o máa wá, ní ìtẹ̀léra", found:"ti rí", go:"Lọ", fdraft:"Àkọ́kọ́ ni àtòjọ àti ìmọ̀ràn yìí. Ẹgbẹ́ gbọ́dọ̀ yẹ̀ wọ́n wò.", wheresub:"Jẹ́ kí fóònù rẹ wá ọ, tàbí tẹ ibi tí o ń rí.", seeplace:"Tàbí tẹ ibi tí o ń rí", skip:"Fi sílẹ̀ ná", whereto:"Níbo ni o fẹ́ lọ?", youat:"O wà ní", change:"Yí i padà", setwhere:"Tẹ ibí láti sọ ibi tí o wà", you:"Ìwọ", startpin:"Ìbẹ̀rẹ̀", herecard:"O wà níbí", showme:"Fi mí hàn", following:"Ó ń tẹ̀lé ọ", far:"Fóònù rẹ sọ pé o wà ní {d} sí ọ̀nà yìí. Ìtọ́sọ́nà bẹ̀rẹ̀ ní {name}: kọ́kọ́ rìn lọ síbẹ̀, tàbí tún yan ibi tí o wà.", whattodo:"Ohun tí o máa ṣe", follow:"Tẹ̀lé mi", walkfor:"Rìn", tleft:"Yà sí òsì", tright:"Yà sí ọ̀tún", tstraight:"Máa lọ tààrà", stepn:"Ìgbésẹ̀", finding:"À ń wá ọ...", nearby:"Nítòsí", going:"Ò ń lọ sí", gpsnote:"Ó ń ṣiṣẹ́ láì lo dátà", typename:"Kọ orúkọ kan, tàbí yí i sí ìsàlẹ̀", locdenied:"Ibi tí o wà ti di títì fún ohun èlò yìí. Tan án nínú ètò aṣàwákiri rẹ, tàbí yan ibi tí o wà nínú àtòjọ.", loctimeout:"GPS ń pẹ́ jù. Jáde síta tàbí gbìyànjú lẹ́ẹ̀kan sí i."},
  pcm: {find:"Find place", sos:"Emergency", here:"Use where I dey now", where:"Where you dey now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search name of place...", map:"See map", note:"This one no dey call anybody. E go help you call and show wetin to do.",
    nopath:"We never save road yet. Landmark:", pending:"Dem never confirm this advice.", tbc:"Dem never confirm the number", arrived:"You don reach",
    start:"Start dey waka go", straight:"Waka straight go", left:"Turn left go", right:"Turn right go", langname:"Pidgin", wai:"Where I dey?", near:"You dey near:", pickhere:"Pick where you dey: ", allplaces:"Show all places", lessons:"Stay safe: wetin to do", draft:"First version. We dey check am with", firstopen:"Turn on your data one time. The app go save itself, then e go work without data.", saving:"E dey save for offline...", ready:"E don ready, no need data", share:"Share where I dey", text:"Text with where I dey", online:"Send alert for internet", needdata:"Turn on your data to use this one.", notyet:"This one never ready. Abeg call or text.", lookfor:"Look am for your way", photo:"Photo go dey here", walk:"Test waka", nolocation:"We no fit see where you dey.", at:"For", theme:"Light or dark", tagline:"Find your way for OAU", tagsub:"Places, direction step by step, and help for emergency. E dey work without data.", recent:"Places you find before", clear:"Clear am", tfind:"Find", tsafe:"Stay safe", aka:"Dem dey also call am", closest:"No exact match. Places wey near am:", share:"Share this place", copied:"Link don copy", longwalk:"Na long waka. Carry water, and enter bus or keke if one dey go your side.", noroute:"No road yet", fresh:"You just come OAU? Freshers trail", freshsub:"First places to find, one by one", found:"don find", go:"Go", fdraft:"Draft list and tips. The team go check am.", wheresub:"Make your phone find you, or tap place wey you dey see.", seeplace:"Or tap place wey you dey see", skip:"Leave am for now", whereto:"Where you wan go?", youat:"You dey for", change:"Change am", setwhere:"Tap here to talk where you dey", you:"You", startpin:"Start", herecard:"You dey here", showme:"Show me", following:"E dey follow you", far:"Your phone talk say you dey {d} far from this road. Direction start for {name}: waka go there first, or pick where you dey again.", whattodo:"Wetin to do", follow:"Follow me", walkfor:"Waka", tleft:"Turn left", tright:"Turn right", tstraight:"Waka straight", stepn:"Step", finding:"We dey find you...", nearby:"Near", going:"You dey go", gpsnote:"E dey work without data", typename:"Write name, or scroll", locdenied:"Location dey off for this app. On am for your browser settings, or pick where you dey from the list.", loctimeout:"GPS dey take too long. Comot go outside or try again."}
};
const CAT = {Libraries:{yo:"Ibi ìkàwé",pcm:"Library"}, "Essential Services":{yo:"Àwọn iṣẹ́ pàtàkì",pcm:"Important services"}, Gates:{yo:"Ẹnu ọ̀nà",pcm:"Gate"},
  "Lecture Theatres":{yo:"Gbọ̀ngàn ìkẹ́kọ̀ọ́",pcm:"Lecture hall"}, Faculties:{yo:"Ẹ̀ka ẹ̀kọ́",pcm:"Faculty"}, Administration:{yo:"Ọ́fíìsì ìṣàkóso",pcm:"Admin"},
  Hostels:{yo:"Ilé ibùgbé akẹ́kọ̀ọ́",pcm:"Hostel"}, Sports:{yo:"Eré ìdárayá",pcm:"Sports ground"}, "Food & Shops":{yo:"Oúnjẹ àti ọjà",pcm:"Food and shops"}};
const EICO = {medical:"heart-pulse", fire:"flame", security:"shield-alert"};
const $ = id => document.getElementById(id);
// Light / dark switch: follows the phone until someone taps it, then remembers their choice.
const SUN = '<svg viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const darkNow = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
function applyTheme() {
  const th = store.get("theme");
  if (th) document.documentElement.dataset.theme = th; else delete document.documentElement.dataset.theme;
  $("themebtn").setAttribute("aria-checked", darkNow());   // the knob slides to the sun (light) or the moon (dark)
}
$("themebtn").querySelector(".tsun").innerHTML = SUN; $("themebtn").querySelector(".tmoon").innerHTML = MOON;
applyTheme();
$("themebtn").onclick = () => { store.set("theme", darkNow() ? "light" : "dark"); applyTheme(); };
let places = [], paths = [], emerg = {categories: []}, lessons = [], fresh = {steps: []}, topic = null, li = 0, all = false, graph, placeId = null, cat = "", ecat = null, hist = [];
let lang = store.get("lang"), session = 0, cur = null, route = null, steps = [], si = 0, seq = [];
let lm, lg, mb;
const t = k => (S[lang] || S.en)[k] || S.en[k];
const tr = o => typeof o === "string" ? o : (o && (o[lang] || o.en)) || "";
const ct = c => (CAT[c] && CAT[c][lang]) || c;
const data = n => window.__DATA ? Promise.resolve(window.__DATA[n]) : fetch("data/" + n + ".json").then(r => r.json());
const shown = () => places.filter(p => !p.hidden && p.verified);
// Waypoints (named junctions, walkways, roads) help directions and "Where am I?", but are not destinations,
// so category lists and search leave them out.
const listed = () => shown().filter(p => !p.waypoint);
const nameOf = id => graph.byId[id].name;
const icon = (cls, svg) => '<i class="' + cls + '">' + svg + "</i>";
const pic = p => p.photo ? '<img src="' + p.photo + '" alt="" width="640" height="360">' : '<div class="ph">' + I("camera") + "<span>" + t("photo") + "</span>" + (p.sample ? '<small class="dev">DEV: add real photo</small>' : "") + "</div>";
const card = (p, extra) => '<li><button data-id="' + p.id + '">' + (p.photo ? '<img class="th" src="' + p.photo + '" alt="" loading="lazy" decoding="async" width="64" height="64">' : icon("mk", M(p.category))) +
  "<div><b>" + p.name + "</b><span>" + tr(p.landmark) + "</span>" + (extra || "") + "</div></button></li>";
// Walking distance and time. 75 m a minute is an easy walking pace (4.5 km/h).
const WALK = 75;
const away = m => (m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1) + " km") + " \u00b7 " + Math.max(1, Math.round(m / WALK)) + " min";
const slug = c => c.toLowerCase().replace(/[^a-z]+/g, "-");

async function load() {
  [places, paths, emerg, lessons, fresh] = await Promise.all(["places", "paths", "emergency", "lessons", "freshers"].map(data));
  graph = Route.buildGraph(places, paths);
  if (!lang) lang = "en";
  // A shared link (…?place=main_gate) opens that place. The address is tidied so a reload does not open it again.
  const sp = new URLSearchParams(location.search).get("place");
  if (sp) history.replaceState(null, "", location.pathname);
  shared = sp && graph.byId[sp] && listed().includes(graph.byId[sp]) ? sp : null;
  applyLang();
  if (store.get("lang")) { hist = ["lang"]; show("find"); } else show("lang");   // the welcome page sits underneath, one Back away
  warm();
  // Decode the pictures on the side pages while the phone is idle, so the first swipe is as smooth as the rest.
  (window.requestIdleCallback || (f => setTimeout(f, 300)))(() => document.querySelectorAll("#pages img").forEach(i => { if (i.decode) i.decode().catch(() => {}); }));
  if (shared && store.get("lang")) { pick(shared); shared = null; }
}
let shared = null;
// Find, Stay safe and Emergency are pages side by side in one "pager": swipe between them or tap the tabs.
// Swiping does not add to the Back history; the history just remembers which page you were on.
// Every new screen is also added to the browser's history, so the phone's own Back button goes back one screen
// (it only leaves the app from the first screen).
const PAGES = ["find", "lessons", "emergency"];
let page = "find";
function show(id, back, replace) {
  if (id === "home") id = "find";
  const pg = PAGES.includes(id), top = hist[hist.length - 1], was = !$("pager").hidden;
  if (!back) {
    if (pg && PAGES.includes(top)) hist[hist.length - 1] = id;
    else if (top !== id) {
      if (replace && hist.length) hist[hist.length - 1] = id;
      else { if (hist.length) history.pushState({n: hist.length + 1}, ""); hist.push(id); }
    }
  }
  if (id !== "nav") stopWatch();
  const scr = pg ? "pager" : id;
  document.querySelectorAll(".screen").forEach(s => { s.hidden = s.id !== scr; });
  document.body.dataset.screen = scr;
  $("back").hidden = id === "lang" || hist.length < 2;   // Back is shown everywhere you can go back from, back to the welcome page
  document.querySelectorAll(".lrow button").forEach(b => b.setAttribute("aria-pressed", !!store.get("lang") && b.dataset.lang === lang));
  if (pg) goPage(id, was); else document.querySelector("main").scrollTop = 0;
}
function goPage(id, smooth) {
  page = id; tabs();
  const el = $("pages"), go = () => el.scrollTo({left: PAGES.indexOf(id) * el.clientWidth, behavior: smooth ? "smooth" : "auto"});
  go(); if (!smooth) requestAnimationFrame(go);   // again after the pager is drawn, in case the browser moved it
}
// The browser must not put the pages back where they were before a reload; the app decides which page shows.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function tabs() {
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.page === page ? "page" : "false"));
  $("tabs").dataset.on = page;
}
// While swiping: move the tab pill with the finger (once per screen frame), and when the finger lifts, make sure the
// pages land exactly on one page. Some phones stop a swipe half way; this finishes it.
let raf = 0, settle = 0, touching = false, lastW = innerWidth;
function onPages() {
  raf = 0;
  const el = $("pages"), x = el.scrollLeft / (el.clientWidth || 1), id = PAGES[Math.round(x)];
  $("tabs").style.setProperty("--p", Math.max(0, Math.min(2, x)));
  if (id && id !== page) { page = id; if (PAGES.includes(hist[hist.length - 1])) hist[hist.length - 1] = id; tabs(); }
}
function land() {
  const el = $("pages"), w = el.clientWidth, x = el.scrollLeft / (w || 1), i = Math.round(x);
  if (!touching && w && Math.abs(x - i) > 0.01) el.scrollTo({left: i * w, behavior: "smooth"});
}
$("pages").addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(onPages); clearTimeout(settle); settle = setTimeout(land, 150); }, {passive: true});
$("pages").addEventListener("scrollend", land);
$("pages").addEventListener("touchstart", () => { touching = true; }, {passive: true});
$("pages").addEventListener("touchend", () => { touching = false; clearTimeout(settle); settle = setTimeout(land, 150); }, {passive: true});
// Phones fire "resize" when the address bar slides away while scrolling; only a real width change needs a re-snap.
addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; if (!$("pager").hidden) goPage(page, false); } });
document.querySelectorAll("#tabs button").forEach(b => { b.onclick = () => show(b.dataset.page); });
function applyLang() {
  document.documentElement.lang = lang === "pcm" ? "en" : lang;
  document.querySelectorAll("[data-t]").forEach(e => { e.innerHTML = (e.dataset.i ? icon("ic", I(e.dataset.i)) : "") + t(e.dataset.t); });
  $("q").placeholder = t("search"); $("wq").placeholder = t("typename"); $("qx").setAttribute("aria-label", t("clear"));
  $("langbtn").innerHTML = I("globe") + '<span class="lc">' + ({en: "EN", yo: "YO", pcm: "PCM"}[lang] || "EN") + "</span>"; $("langbtn").setAttribute("aria-label", t("langname"));
  $("themebtn").setAttribute("aria-label", t("theme"));
  $("mapbtn").innerHTML = icon("ic", I("map")) + t("map");
  $("devbar").hidden = !places.some(p => p.sample);
  topics(); if (topic && !$("slides").hidden) slide();
  cats(); list(); ecats(); fromCard(); if (!$("where").hidden) wlist();
  if (route) { buildCards(); setStep(si, false); startNavSummary(); }
  if (!$("freshers").hidden) freshList();
}
function cats() {
  const cs = [...new Set(listed().map(p => p.category))].sort();
  $("cats").innerHTML = cs.map(c => '<button data-c="' + c + '" class="k-' + slug(c) + '">' + icon("mk", M(c)) + "<b>" + ct(c) + "</b></button>").join("");
  $("cats").querySelectorAll("button").forEach(b => { b.onclick = () => { cat = b.dataset.c; list(); }; });
}
// Recent places: the last 6 places someone chose, newest first, kept on this phone only.
const CLOCK = '<svg viewBox="0 0 24 24" width="16" height="16"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></g></svg>';
const recent = () => { try { return JSON.parse(store.get("recent")) || []; } catch (e) { return []; } };
const remember = id => store.set("recent", JSON.stringify([id].concat(recent().filter(x => x !== id)).slice(0, 6)));
function recents(on) {
  const ok = new Set(listed().map(p => p.id)), r = recent().filter(id => ok.has(id));
  $("recent").hidden = on || !r.length;
  $("recent").querySelector("b").innerHTML = CLOCK + t("recent");
  $("rchips").innerHTML = r.map(id => '<button data-id="' + id + '">' + icon("mk", M(graph.byId[id].category)) + "<span>" + nameOf(id) + "</span></button>").join("");
  $("rchips").querySelectorAll("button").forEach(b => { b.onclick = () => pick(b.dataset.id); });
}
// Search: ignores capitals, accents and punctuation ("hall 3" finds "Hall-3"), and when nothing matches exactly it
// forgives small typing mistakes ("libary", "jaja hal"). When a nickname matched, the card says so.
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function typos(a, b) {   // how many letters must change to turn a into b (stops counting above 2)
  if (Math.abs(a.length - b.length) > 2) return 3;
  let row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}
const close = (qw, words) => words.some(w => w.startsWith(qw) || (qw.length >= 4 && typos(qw, w.slice(0, qw.length + 1)) <= (qw.length >= 7 ? 2 : 1)));
function list() {
  const q = norm($("q").value), on = cat || q || all;
  recents(!!on); freshCard(!!on);
  $("cats").hidden = !!on; $("list").hidden = !on; $("catpill").hidden = !cat;
  $("catpill").innerHTML = cat ? icon("mk", M(cat)) + ct(cat) + " " + I("x") : "";
  $("qx").hidden = !$("q").value; $("q").parentNode.classList.toggle("typed", !!$("q").value);
  const pool = listed().filter(p => !cat || p.category === cat), names = p => [p.name].concat(p.aliases || []);
  let hits = pool.map(p => ({p, by: q ? names(p).find(x => norm(x).includes(q)) : p.name})).filter(h => h.by);
  const fuzzy = q && !hits.length;
  if (fuzzy) {
    const qws = q.split(" ").filter(w => w.length >= 3);
    hits = pool.map(p => ({p, by: names(p).find(x => { const ws = norm(x).split(" "); return qws.length && qws.every(qw => close(qw, ws)); })})).filter(h => h.by);
  }
  $("closest").hidden = !fuzzy || !hits.length; $("closest").textContent = t("closest");
  $("list").innerHTML = hits.sort((x, y) => x.p.name.localeCompare(y.p.name))
    .map(h => card(h.p, h.by !== h.p.name ? '<em class="aka">' + t("aka") + ": " + h.by + "</em>" : "")).join("");
  $("list").querySelectorAll("button").forEach(b => { b.onclick = () => pick(b.dataset.id); });
}
// Freshers trail: a short ordered list of first places to find, ticked off on this phone.
// Switched off until the team has checked the list and tips (set to true to show the card on Find).
const FRESHERS = false;
const freshDone = () => { try { return JSON.parse(store.get("fresh")) || []; } catch (e) { return []; } };
const freshSteps = () => fresh.steps.filter(s => graph.byId[s.place]);
function freshCard(on) {
  const n = freshSteps().length, k = freshSteps().filter(s => freshDone().includes(s.place)).length;
  $("freshcard").hidden = on || !n || !FRESHERS;
  $("freshcard").innerHTML = icon("mk", I("flag")) + "<span><b>" + t("fresh") + "</b><small>" + k + " / " + n + " " + t("found") + "</small></span>" + I("arrow-right");
}
function freshList() {
  const st = freshSteps(), done = freshDone(), k = st.filter(s => done.includes(s.place)).length;
  $("fprog").firstChild.style.width = (st.length ? 100 * k / st.length : 0) + "%";
  $("fcount").textContent = k + " / " + st.length + " " + t("found");
  $("fsteps").innerHTML = st.map((s, i) => { const p = graph.byId[s.place], ok = done.includes(s.place);
    return '<li class="' + (ok ? "ok" : "") + '"><button class="tick" data-id="' + p.id + '" aria-pressed="' + ok + '" aria-label="' + p.name + '">' + (ok ? I("circle-check") : "<b>" + (i + 1) + "</b>") + "</button>" +
      "<div><b>" + p.name + "</b><span>" + tr(s.tip) + '</span></div><button class="go" data-id="' + p.id + '">' + t("go") + "</button></li>"; }).join("");
  $("fsteps").querySelectorAll(".tick").forEach(b => { b.onclick = () => {
    const d = freshDone(), id = b.dataset.id;
    store.set("fresh", JSON.stringify(d.includes(id) ? d.filter(x => x !== id) : d.concat(id))); freshList(); freshCard(false);
  }; });
  $("fsteps").querySelectorAll(".go").forEach(b => { b.onclick = () => pick(b.dataset.id); });
}
// Choosing where to go. If we already know where you are, the directions open straight away;
// if not, the big "Where are you now?" page asks first, then opens them.
let fromId = null, fromGps = false, pendingDest = false;
function pick(id) {
  remember(id); placeId = id;
  if (fromId && fromId !== id) startNav(fromId); else whereScreen(true);
}
function whereScreen(forDest) { pendingDest = forDest; $("wq").value = ""; $("gpsmsg").textContent = ""; wlist(); show("where"); }
// "Where are you now?": one big button lets the phone find you (GPS needs no data), or you tap a place you can see.
// Photos come first in the list, because someone new to OAU knows what a building looks like, not what it is called.
function wlist() {
  const g = pendingDest && placeId ? graph.byId[placeId] : null, d = g ? Route.distancesFrom(graph, placeId) : {}, q = norm($("wq").value);
  $("wqx").hidden = !$("wq").value;
  $("going").hidden = !g; $("going").innerHTML = g ? '<small class="tag go">' + t("going") + "</small><b>" + g.name + "</b>" : "";
  $("gps").innerHTML = I("locate-fixed") + "<span><b>" + t("here") + "</b><small>" + t("gpsnote") + "</small></span>";
  $("wlist").innerHTML = shown().filter(p => !g || p.id !== g.id)
    .filter(p => !q || [p.name].concat(p.aliases || []).some(x => norm(x).includes(q)))
    .sort((x, y) => (y.photo ? 1 : 0) - (x.photo ? 1 : 0) || x.name.localeCompare(y.name))
    .map(p => card(p, g ? '<em class="far">' + (d[p.id] != null ? away(d[p.id]) : t("noroute")) + "</em>" : "")).join("");
  $("wlist").querySelectorAll("button").forEach(b => { b.onclick = () => setFrom(b.dataset.id, false); });
}
function setFrom(id, gps) {
  fromId = id; fromGps = gps; fromCard();
  if (pendingDest && placeId && placeId !== id) { pendingDest = false; startNav(id); } else show("find");
}
function fromCard() {
  $("fromcard").innerHTML = icon("mk", I("locate-fixed")) + '<span><small class="tag here">' + t("youat") + "</small><b>" +
    (fromId ? (fromGps ? t("nearby") + " " : "") + nameOf(fromId) : t("setwhere")) + "</b></span><em>" + t("change") + "</em>";
}
function gpsFind() {
  if (!navigator.geolocation) { $("gpsmsg").textContent = t("nolocation"); return; }
  askCompass(); $("gpsmsg").textContent = t("finding");
  navigator.geolocation.getCurrentPosition(pos => {
    const m = {lat: pos.coords.latitude, lng: pos.coords.longitude}; let best = null, bd = Infinity;
    shown().filter(p => !pendingDest || p.id !== placeId).forEach(p => { const dd = Route.haversine(m, p); if (dd < bd) { bd = dd; best = p; } });
    if (best) setFrom(best.id, true); else $("gpsmsg").textContent = t("nolocation");
  }, e => { $("gpsmsg").textContent = locErr(e); }, {enableHighAccuracy: true, timeout: 20000, maximumAge: 30000});
}
// Share a place: the phone's own share menu (WhatsApp, SMS…), or WhatsApp directly on computers without one.
const SHARE = '<svg class="ic" viewBox="0 0 24 24" width="20" height="20"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></g></svg>';
function sharePlace() {
  const p = graph.byId[placeId], url = location.origin + location.pathname + "?place=" + p.id, text = p.name + " (OAU Navigator)";
  if (navigator.share) navigator.share({title: p.name, text, url}).catch(() => {});
  else open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
}
function startNav(from) {
  route = Route.shortestPath(graph, from, placeId);
  steps = route ? Route.directions(graph, route.ids) : []; si = 0;
  startNavSummary(); show("nav"); buildCards(); map(route && route.ids); setStep(0, false);
  if (fromGps) { startWatch(); setFollow(true); }   // you used GPS to start, so the map follows you straight away
}
// Total distance and time at the top of the directions, and a warning for walks of 10 minutes or more.
function startNavSummary() {
  const g = graph.byId[placeId];
  $("summary").innerHTML = '<div class="sumrow">' + icon("mk", M(g.category)) + "<span>" + '<small class="tag go">' + t("going") + "</small><b>" + g.name + "</b>" +
    (route ? '<em class="far">' + away(route.meters) + "</em>" : "") + '</span><button id="share" aria-label="' + t("share") + '">' + SHARE + "</button></div>" +
    (route && route.meters / WALK >= 10 ? '<small class="warn">' + I("flame") + t("longwalk") + "</small>" : "");
  $("share").onclick = sharePlace;
}
// One card per step, side by side: swipe or use the arrows. The first card says where you are, the last one that you
// have arrived. Each card has one photo, one instruction and one distance, nothing else.
function buildCards() {
  if (!route) {
    $("scards").innerHTML = '<article class="scard"><div class="shead"><span class="sico">' + I("map-pin") + "</span></div><p class=\"stext\">" + t("nopath") + " " + tr(graph.byId[placeId].landmark) + "</p></article>";
    return;
  }
  const n = steps.length, start = graph.byId[route.ids[0]], end = graph.byId[placeId];
  // How far to walk on each card: from this turn to the next one (not all the way to the place named in it).
  const leg = i => { const a = steps[i].from, b = i + 1 < n ? steps[i + 1].from : route.ids.length - 1; let m = 0;
    for (let k = a; k < b; k++) m += Route.haversine(graph.byId[route.ids[k]], graph.byId[route.ids[k + 1]]);
    return '<small class="leg">' + t("walkfor") + " " + away(m) + "</small>"; };
  // "Turn left towards X" only when X is a place on the way; when X is where you are going, just "Turn left".
  const what = s => s.to === placeId ? "<b>" + t("t" + s.turn) + "</b>" : "<small>" + t(s.turn) + "</small><b>" + nameOf(s.to) + "</b>";
  const one = (ico, label, p, text, tag) => '<article class="scard"><div class="shead"><span class="sico">' + I(ico) + '</span><small class="' + (tag ? "tag " + tag : "") + '">' + label + "</small></div>" + (p ? '<div class="pic">' + pic(p) + "</div>" : '<div class="bigturn">' + I(ico) + "</div>") + '<div class="stext">' + text + "</div></article>";
  $("scards").innerHTML = steps.map((s, i) => i === 0
    ? one("footprints", t("herecard"), start, "<b>" + start.name + "</b>" + leg(0), "here")
    : one(s.turn, t("stepn") + " " + i, s.near ? graph.byId[s.near] : null,   // a photo only when there is a landmark to see at the turn
        (s.near ? '<small class="lm">' + t("at") + " " + nameOf(s.near) + "</small>" : "") + what(s) + leg(i))
  ).join("") + one("flag", t("arrived"), end, "<b>" + end.name + "</b><small>" + tr(end.landmark) + "</small>", "done");
  $("scards").scrollLeft = 0;
}
function setStep(i, scroll) {
  const n = route ? steps.length : 0;
  si = Math.max(0, Math.min(n, i));
  $("dots").innerHTML = Array.from({length: n + 1}, (_, k) => '<i class="' + (k <= si ? "on" : "") + '"></i>').join("");
  $("prev").innerHTML = I("arrow-left"); $("next").innerHTML = I("arrow-right");
  $("prev").disabled = si === 0; $("next").disabled = si >= n;
  if (scroll) { const el = $("scards"); ctarget = si; el.scrollTo({left: si * el.clientWidth, behavior: "smooth"}); }
  hiStep();
}
// The map is drawn from our own data, so it works offline: OpenStreetMap roads in grey, footpaths the Field team
// walked as green dashes, every place as a small dot, then the route on top with pins at both ends and at turn landmarks.
let proj, stepLine, arrows, nearPin, startPin;
function map(ids) {
  if (!lm) {
    lm = L.map("map", {crs: L.CRS.Simple, minZoom: -3, maxZoom: 4, zoomSnap: 0.25, attributionControl: false});
    let lat0 = Infinity, lng0 = Infinity;
    places.forEach(p => { lat0 = Math.min(lat0, p.lat); lng0 = Math.min(lng0, p.lng); });
    const kx = Math.cos(lat0 * Math.PI / 180);
    proj = p => [(p.lat - lat0) * 1e5, (p.lng - lng0) * kx * 1e5];
    const roads = [], foot = [];
    // Roads and walked footpaths look the same (both are just "ways"), so the map stays calm; places are small dots.
    paths.forEach(([a, b]) => { const A = graph.byId[a], B = graph.byId[b]; roads.push([proj(A), proj(B)]); });
    L.polyline(roads, {className: "mroad", interactive: false}).addTo(lm);
    listed().forEach(p => L.circleMarker(proj(p), {radius: 3.5, className: "mdot k-" + slug(p.category || ""), interactive: false}).addTo(lm));
    lg = L.layerGroup().addTo(lm);
    lm.on("zoomend", () => hiStep(true));
    $("mapwrap").addEventListener("pointerdown", e => { if (follow && !e.target.closest("#locate")) setFollow(false); });
  }
  lg.clearLayers(); mb = null; if (!ids) return;
  const pts = ids.map(i => graph.byId[i]);
  L.polyline(pts.map(proj), {className: "mroute", interactive: false}).addTo(lg);
  stepLine = L.polyline([], {className: "mstep", interactive: false}).addTo(lg);
  arrows = L.layerGroup().addTo(lg); nearPin = null;
  startPin = pin(pts[0], " start", '<img src="icons/art/stand.webp" alt="" width="40" height="40">', t("herecard"));
  pin(pts[pts.length - 1], " focus", M(pts[pts.length - 1].category), pts[pts.length - 1].name);
  mb = L.latLngBounds(pts.map(proj)).pad(0.2); fit(); hiStep(true);
}
// The step you are on is drawn on top of the route as moving dots, and the map shows that part of the walk
// (unless the map is following your GPS).
const pin = (p, cls, ico, label) => L.marker(proj(p), {interactive: false, icon: L.divIcon({className: "", iconSize: null, html: '<div class="pin' + cls + '"><span>' + ico + "</span><em>" + label + "</em></div>"})}).addTo(lg);
// Arrows every 30 m along the step you are on, pointing the way to walk.
const ARROW = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3l7 9h-4.5v9h-5v-9H5z" fill="#fff" stroke="#0d1b8e" stroke-width="1.6" stroke-linejoin="round"/></svg>';
// The gap between arrows grows when you zoom out (about one arrow per 70 screen pixels), so they never pile up.
function arrowsOn(seg) {
  arrows.clearLayers(); const gap = Math.max(30 / M_PER_UNIT, 70 / Math.pow(2, lm.getZoom())); let left = gap / 2;
  for (let k = 1; k < seg.length; k++) {
    const [y1, x1] = seg[k - 1], [y2, x2] = seg[k], len = Math.hypot(x2 - x1, y2 - y1), deg = Math.atan2(x2 - x1, y2 - y1) * 180 / Math.PI;
    for (; left < len; left += gap) {
      const f = left / len;
      L.marker([y1 + (y2 - y1) * f, x1 + (x2 - x1) * f], {interactive: false, icon: L.divIcon({className: "", iconSize: null, html: '<i class="arr" style="transform:translate(-50%,-50%) rotate(' + deg.toFixed(0) + 'deg)">' + ARROW + "</i>"})}).addTo(arrows);
    }
    left -= len;
  }
}
function hiStep(first) {
  if (!lm || !stepLine || !route) return;
  const s = steps[si];
  if (nearPin) { nearPin.remove(); nearPin = null; }
  if (!s) { stepLine.setLatLngs([]); arrows.clearLayers(); return; }
  const seg = route.ids.slice(s.from, s.end + 1).map(i => proj(graph.byId[i]));
  stepLine.setLatLngs(seg); arrowsOn(seg);
  if (s.near) nearPin = pin(graph.byId[s.near], " on", M(graph.byId[s.near].category), graph.byId[s.near].name);   // only this step's landmark
  if (!first && !follow && $("mapbox").open && lm.getSize().x) lm.fitBounds(L.latLngBounds(seg).pad(0.4), {maxZoom: 1.5});
}
// "You" on the map: a blue dot that moves with your GPS, an arrow for the way you face, and a pale circle for
// how accurate the GPS is. It starts when you tap the button on the map (or chose "Use my location"), stops when
// you leave the directions, and your position never leaves the phone.
let watch = null, youM = null, accC = null, follow = false, link = null;
const M_PER_UNIT = 111320 / 1e5;   // the map works in units of 1/100000 of a degree, about 1.1 m
function startWatch() {
  if (watch !== null || !navigator.geolocation) return;
  watch = navigator.geolocation.watchPosition(onPos, e => { $("status").textContent = locErr(e); stopWatch(); }, {enableHighAccuracy: true, maximumAge: 5000, timeout: 30000});
  addEventListener("deviceorientationabsolute", onTurn); addEventListener("deviceorientation", onTurn);
}
const locErr = e => t(e && e.code === 1 ? "locdenied" : e && e.code === 3 ? "loctimeout" : "nolocation");
// iPhones only give the compass after asking, and only straight after a tap.
function askCompass() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === "function") D.requestPermission().catch(() => {});
}
function stopWatch() {
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  watch = null; if (follow) setFollow(false);
  removeEventListener("deviceorientationabsolute", onTurn); removeEventListener("deviceorientation", onTurn);
  if (youM) { youM.remove(); accC.remove(); youM = accC = null; }
  if (link) { link.remove(); link = null; } $("mapnote").hidden = true;
  rot = null;
}
function onPos(pos) {
  if (!lm) return;
  const p = proj({lat: pos.coords.latitude, lng: pos.coords.longitude});
  if (!youM) {
    accC = L.circle(p, {radius: 1, className: "me-acc", interactive: false}).addTo(lm);
    youM = L.marker(p, {interactive: false, zIndexOffset: 1000, icon: L.divIcon({className: "", iconSize: null, html: '<div class="you"><s></s><i></i><em>' + t("herecard") + "</em></div>"})}).addTo(lm);
  }
  youM.setLatLng(p); accC.setLatLng(p); accC.setRadius(pos.coords.accuracy / M_PER_UNIT);
  // Near the route (anywhere along it, not only at the start): the blue dot is "you", the start pin goes, and a
  // dashed line joins you to the nearest point of the route. Far from it (more than 300 m, e.g. testing at home):
  // say so plainly, keep the start pin, and do not follow.
  const me = {lat: pos.coords.latitude, lng: pos.coords.longitude}, start = route && graph.byId[route.ids[0]];
  let d = 0, near = start;
  if (route) { d = Infinity; route.ids.forEach(i => { const q = graph.byId[i], dq = Route.haversine(me, q); if (dq < d) { d = dq; near = q; } }); }
  const far = d > 300;
  $("mapnote").hidden = !far;
  if (far) { $("mapnote").textContent = t("far").replace("{d}", away(d).split(" \u00b7 ")[0]).replace("{name}", start.name); if (follow) setFollow(false);
    const em = startPin && startPin.getElement() && startPin.getElement().querySelector("em");
    if (em) em.textContent = t("startpin") + ": " + start.name;   // the phone is elsewhere, so the pin only marks where the route starts
  }
  else if (startPin) { startPin.remove(); startPin = null; }
  if (link) link.remove();
  link = route && !far && d > 15 ? L.polyline([p, proj(near)], {className: "mlink", interactive: false}).addTo(lm) : null;
  if (pos.coords.heading != null && pos.coords.speed > 0.5) face(pos.coords.heading);   // walking: GPS knows the direction
  if (follow) lm.panTo(p, {animate: true, duration: 0.6, easeLinearity: 1});
}
// The compass: Android gives "deviceorientationabsolute", iPhones give webkitCompassHeading. Both work with no data.
// The turn of the screen (phone held sideways) is added, and the beam always turns the short way round.
let rot = null, turnRaf = 0;
function onTurn(e) {
  const h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null);
  if (h == null) return;
  const sa = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  face((h + sa) % 360);
}
// The beam (and, in follow mode, the whole map) turns smoothly: every screen frame it moves a quarter of the way
// to the compass reading, so it never jumps and never lags behind.
let shownRot = 0, spinRaf = 0;
function face(h) {
  rot = rot === null ? h : rot + ((h - rot % 360 + 540) % 360) - 180;
  if (!spinRaf) spinRaf = requestAnimationFrame(spin);
}
function spin() {
  spinRaf = 0;
  shownRot += (rot - shownRot) * 0.25;
  if (Math.abs(rot - shownRot) > 0.1) spinRaf = requestAnimationFrame(spin); else shownRot = rot;
  const el = youM && youM.getElement() && youM.getElement().querySelector(".you");
  if (el) { el.classList.add("dir"); el.style.setProperty("--h", shownRot.toFixed(1) + "deg"); }
  if (follow) { $("map").style.transform = "rotate(" + (-shownRot).toFixed(1) + "deg)"; $("map").style.setProperty("--mr", shownRot.toFixed(1) + "deg"); }
}
// Follow mode: the map keeps you in the middle and turns so the way you face is always "up".
// Touching the map hands control back to you (the map stops turning and you can drag it again).
function setFollow(on) {
  follow = on; const w = $("mapwrap");
  $("locate").setAttribute("aria-pressed", on); $("locate").innerHTML = I(on ? "navigation" : "locate-fixed") + "<b>" + t(on ? "following" : "showme") + "</b>";
  if (on) { const r = w.getBoundingClientRect(); w.style.setProperty("--d", Math.ceil(Math.hypot(r.width, r.height)) + "px"); }
  w.classList.toggle("turn", on); $("youtag").hidden = !on; $("youtag").textContent = t("herecard");
  if (!on) { $("map").style.transform = ""; $("map").style.removeProperty("--mr"); }
  if (!lm) return;
  on ? lm.dragging.disable() : lm.dragging.enable();
  lm.invalidateSize({pan: false});
  if (on && youM) lm.setView(youM.getLatLng(), Math.max(lm.getZoom(), 1.5), {animate: false});
  if (on && rot !== null) spin();
}
function fit() { if (lm && mb) { lm.invalidateSize(); if (lm.getSize().x) lm.fitBounds(mb); } }
function ecats() {
  const cs = emerg.categories; if (!cs.length) return; ecat = ecat || cs[0].id;
  const les = c => lessons.find(l => l.id === c.lesson);
  $("ecats").innerHTML = cs.map(c => '<button data-c="' + c.id + '" aria-pressed="' + (c.id === ecat) + '">' + (les(c) ? '<img class="tart" src="icons/art/' + les(c).art + '.webp" alt="" width="56" height="56" decoding="async">' : I(EICO[c.id])) + "<b>" + tr(c.label) + "</b></button>").join("");
  $("ecats").querySelectorAll("button").forEach(b => { b.onclick = () => { ecat = b.dataset.c; ecats(); }; });
  const c = cs.find(x => x.id === ecat), l = les(c);
  $("ebody").innerHTML = c.contacts.map(k => k.number
    ? '<a class="call" href="tel:' + k.number.replace(/[^\d+]/g, "") + '">' + I("phone") + "<span><small>" + tr(k.label) + "</small><b>" + k.number + "</b></span></a>"
    : '<span class="tbc">' + tr(k.label) + " (" + t("tbc") + ")</span>").join("") + (c.say ? '<p class="say">' + tr(c.say) + "</p>" : "") +
    '<button id="wai" class="secondary">' + icon("ic", I("map-pin")) + t("wai") + '</button><p id="waimsg"></p>' +
    (l ? '<h3 class="dh">' + t("whattodo") + '</h3><div id="edeck" class="deck"></div>' : "");
  $("wai").onclick = whereAmI;
  if (l) deck($("edeck"), lcards(l));
}
// Saves the photos on the phone so they work offline.
async function warm() {
  if (!("serviceWorker" in navigator) || window.__DATA) return;
  $("status").innerHTML = icon("ic", I("circle-check")) + t("saving");
  await navigator.serviceWorker.ready;
  const arts = new Set(lessons.flatMap(l => [l.art].concat(...l.steps.map(s => s.art || []))));
  await Promise.allSettled(shown().filter(p => p.photo).map(p => fetch(p.photo)).concat([...arts].map(n => fetch("icons/art/" + n + ".webp"))));
  $("status").innerHTML = icon("ic", I("circle-check")) + t("ready");
}
// "Where am I?": nearest place by GPS, or pick from a list if GPS fails.
function whereAmI() {
  const out = $("waimsg"), say = p => { out.textContent = t("near") + " " + p.name; };
  const pick = () => {
    out.innerHTML = t("pickhere") + '<select id="waisel"><option></option>' + shown().map(p => '<option value="' + p.id + '">' + p.name + "</option>").join("") + "</select>";
    $("waisel").onchange = e => { if (e.target.value) say(graph.byId[e.target.value]); };
  };
  if (!navigator.geolocation) return pick();
  navigator.geolocation.getCurrentPosition(pos => {
    const m = {lat: pos.coords.latitude, lng: pos.coords.longitude}; let best = null, bd = 1e9;
    shown().forEach(p => { const d = Route.haversine(m, p); if (d < bd) { bd = d; best = p; } });
    best ? say(best) : pick();
  }, pick, {timeout: 8000, maximumAge: 30000});
}
// A deck: cards side by side. Swipe, or tap the arrows; the dots show how far you are. A half swipe is finished
// for you, and while the cards glide after a tap, the in-between positions are ignored (no jumping dots).
function deck(box, cards) {
  box.innerHTML = '<div class="dtrack">' + cards.join("") + '</div><div class="dnav"><button class="dprev secondary" aria-label="Previous">' + I("arrow-left") +
    '</button><div class="ddots">' + cards.map(() => "<i></i>").join("") + '</div><button class="dnext secondary" aria-label="Next">' + I("arrow-right") + "</button></div>";
  const tr = box.firstChild, dots = box.querySelectorAll(".ddots i"), prev = box.querySelector(".dprev"), next = box.querySelector(".dnext");
  let at = 0, target = null, raf = 0, settle = 0;
  const mark = k => { at = k; dots.forEach((d, j) => d.classList.toggle("on", j <= k)); prev.disabled = k === 0; next.disabled = k === cards.length - 1; };
  const go = k => { k = Math.max(0, Math.min(cards.length - 1, k)); target = k; mark(k); tr.scrollTo({left: k * tr.clientWidth, behavior: "smooth"}); };
  tr.addEventListener("touchstart", () => { target = null; }, {passive: true});
  tr.addEventListener("scroll", () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; const k = Math.round(tr.scrollLeft / (tr.clientWidth || 1));
      if (target !== null) { if (Math.abs(tr.scrollLeft - target * tr.clientWidth) < 2) target = null; return; }
      if (k !== at) mark(k); });
    clearTimeout(settle); settle = setTimeout(() => { const w = tr.clientWidth, x = tr.scrollLeft / (w || 1); if (w && Math.abs(x - Math.round(x)) > 0.01) tr.scrollTo({left: Math.round(x) * w, behavior: "smooth"}); }, 160);
  }, {passive: true});
  prev.onclick = () => go(at - 1); next.onclick = () => go(at + 1);
  mark(0);
}
// The 3D pictures (Microsoft Fluent Emoji, MIT licence), saved in icons/art so they work offline.
const art = names => '<div class="art">' + (names || []).map((n, i) => '<img class="a' + i + '" src="icons/art/' + n + '.webp" alt="" width="192" height="192" decoding="async">').join("") + "</div>";
const lcards = l => l.steps.map((s, i) => '<article class="lcard">' + art(s.art) + '<p class="lt">' + tr(s.text) + '</p><small class="lnum">' + (i + 1) + " / " + l.steps.length + "</small></article>");
// Safety lessons: one illustrated card per step, swipeable.
function topics() {
  $("topics").innerHTML = lessons.map(l => '<button data-id="' + l.id + '"><img class="tart" src="icons/art/' + l.art + '.webp" alt="" width="72" height="72" decoding="async"><b>' + tr(l.title) + "</b></button>").join("");
  $("topics").querySelectorAll("button").forEach(b => { b.onclick = () => { topic = lessons.find(l => l.id === b.dataset.id); show("slides"); slide(); }; });
}
function slide() {
  $("ltitle").textContent = tr(topic.title); deck($("ldeck"), lcards(topic));

}
document.querySelectorAll("[data-go]").forEach(b => { b.onclick = () => show(b.dataset.go); });
document.querySelectorAll("#lang [data-lang]").forEach(b => { b.onclick = () => {
  lang = b.dataset.lang; store.set("lang", lang); applyLang(); warm();
  if (hist.length > 1) { history.back(); return; }   // opened with the language button: go back to where you were
  if (shared) { pick(shared); shared = null; } else whereScreen(false);
}; });
// Landing page: the 3D shapes lean a little towards your finger (or as you tilt the phone).
const lean = (x, y) => { const l = $("lang"); l.style.setProperty("--px", x.toFixed(2)); l.style.setProperty("--py", y.toFixed(2)); };
$("lang").addEventListener("pointermove", e => lean(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5));
addEventListener("deviceorientation", e => { if (!$("lang").hidden && e.gamma != null) lean(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 40) / 30)) / 2); });
$("langbtn").onclick = () => show("lang");
$("back").onclick = () => history.back();
addEventListener("popstate", () => {
  if (!$("viewer").hidden) { $("viewer").hidden = true; return; }
  if (hist.length > 1) { hist.pop(); show(hist[hist.length - 1], true); }
});
// Tap a place photo to see it full screen; tap again, the X, or the phone's Back button to close it.
document.addEventListener("click", e => {
  const img = e.target.closest(".pic img");
  if (!img) return;
  $("viewer").querySelector("img").src = img.src; $("viewer").hidden = false; history.pushState({photo: 1}, "");
});
$("viewer").onclick = () => history.back();
$("q").oninput = list;
$("q").onkeydown = e => { if (e.key === "Enter") { const b = $("list").querySelector("button"); if (b) b.click(); } };   // Enter opens the first result
$("qx").onclick = () => { $("q").value = ""; list(); $("q").focus(); };
$("wq").oninput = wlist;
$("wqx").onclick = () => { $("wq").value = ""; wlist(); $("wq").focus(); };
$("sosbtn").onclick = () => show("emergency");
$("gps").onclick = gpsFind;
$("wskip").onclick = () => show("find");
$("fromcard").onclick = () => whereScreen(false);
$("freshcard").onclick = () => { freshList(); show("freshers"); }; $("rclear").onclick = () => { store.set("recent", "[]"); list(); }; $("catpill").onclick = () => { cat = ""; list(); };
$("prev").onclick = () => setStep(si - 1, true);
$("next").onclick = () => setStep(si + 1, true);
let craf = 0, csettle = 0, ctarget = null;
$("scards").addEventListener("touchstart", () => { ctarget = null; }, {passive: true});
$("scards").addEventListener("scroll", () => {
  if (!craf) craf = requestAnimationFrame(() => { craf = 0; const el = $("scards"), i = Math.round(el.scrollLeft / (el.clientWidth || 1));
    if (ctarget !== null) { if (Math.abs(el.scrollLeft - ctarget * el.clientWidth) < 2) ctarget = null; return; }   // gliding after a tap on an arrow
    if (i !== si) setStep(i, false); });
  clearTimeout(csettle); csettle = setTimeout(() => { const el = $("scards"), w = el.clientWidth, x = el.scrollLeft / (w || 1); if (w && Math.abs(x - Math.round(x)) > 0.01) el.scrollTo({left: Math.round(x) * w, behavior: "smooth"}); }, 160);
}, {passive: true});
$("mapbox").ontoggle = () => requestAnimationFrame(fit);
$("locate").onclick = () => {
  if (watch === null) { askCompass(); startWatch(); }
  setFollow(!follow);
};
document.querySelectorAll("[data-ico]").forEach(e => { e.innerHTML = I(e.dataset.ico); });
$("back").innerHTML = I("arrow-left"); $("locate").innerHTML = I("locate-fixed") + "<b>" + t("showme") + "</b>";
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
load();
