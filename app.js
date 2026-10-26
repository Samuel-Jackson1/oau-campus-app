// app.js: picture-first, one step at a time. Every screen word is translated in all 3 languages.
// All Yoruba and Pidgin lines are FIRST DRAFTS: native speakers must check them.
// Safe storage: some viewers (chat previews, sandboxes) block it. The app must still open.
const store = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
window.addEventListener("error", e => { const b = document.getElementById("status"); if (b) b.textContent = "Error: " + e.message + ". Please reload."; });
const S = {
  en: {find:"Find a place", sos:"Emergency", here:"Use my location", where:"Where are you now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search a place...", map:"See map", note:"This screen does not alert anyone. It helps you call and shows what to do.",
    nopath:"No walking route saved yet. Landmark:", pending:"Advice not yet confirmed.", tbc:"Number to be confirmed", arrived:"You have arrived",
    start:"Start by walking to", straight:"Go straight to", left:"Turn left towards", right:"Turn right towards", langname:"English", wai:"Where am I?", near:"You are near:", pickhere:"Pick where you are: ", allplaces:"Show all places", lessons:"Stay safe: what to do", draft:"Draft. Not yet checked by the responsible office.", firstopen:"Turn on mobile data once. The app saves itself, then works without data.", saving:"Saving for offline use...", ready:"Ready to use without data", share:"Share my location", text:"Text with my location", online:"Send alert online", needdata:"Turn on mobile data to use this.", notyet:"Online alert is not set up yet. Please call or text.", lookfor:"Look for it on your way", photo:"Photo goes here", walk:"Demo walk", nolocation:"Could not find your location.", at:"At", theme:"Light or dark", tagline:"Find your way around OAU", tagsub:"Places, step-by-step directions and emergency help. Works without data.", recent:"Recent", clear:"Clear", tfind:"Find", tsafe:"Stay safe", aka:"Also called", closest:"No exact match. Closest places:", share:"Share this place", copied:"Link copied", longwalk:"Long walk. Carry water, and take a bus or keke if one is going your way.", noroute:"No route yet", fresh:"New to OAU? Freshers trail", freshsub:"The first places to find, in order", found:"found", go:"Go", fdraft:"Draft list and tips. The team must check them.", locdenied:"Location is off for this app. Turn it on in your browser settings, or pick where you are from the list.", loctimeout:"GPS is taking too long. Step outside or try again."},
  yo: {find:"Wá ibì kan", sos:"Pàjáwìrì", here:"Lo ibi tí mo wà", where:"Níbo ni o wà báyìí?", listen:"Gbọ́", live:"Ọfà ìtọ́sọ́nà",
    turn:"Yí fóònù rẹ", search:"Wá orúkọ ibì kan...", map:"Wo àwòrán ilẹ̀", note:"Èyí kò ní ránṣẹ́ sí ẹnikẹ́ni. Ó ń ràn ọ́ lọ́wọ́ láti pe ìrànwọ́, ó sì fi ohun tí o máa ṣe hàn ọ́.",
    nopath:"A kò tíì fi ọ̀nà pamọ́. Àmì ibi:", pending:"A kò tíì jẹ́rìí ìmọ̀ràn yìí.", tbc:"A ṣì ń jẹ́rìí nọ́ńbà náà", arrived:"O ti dé",
    start:"Bẹ̀rẹ̀ nípa rírìn lọ sí", straight:"Máa lọ tààrà sí", left:"Yà sí òsì sí", right:"Yà sí ọ̀tún sí", langname:"Yorùbá", wai:"Níbo ni mo wà?", near:"O wà nítòsí:", pickhere:"Yan ibi tí o wà: ", allplaces:"Fi gbogbo ibi hàn", lessons:"Dúró láìséwu: ohun tí o máa ṣe", draft:"Àkọ́kọ́. Ọ́fíìsì tó yẹ kò tíì yẹ̀ ẹ́ wò.", firstopen:"Tan dátà alágbèéká rẹ lẹ́ẹ̀kan. Ohun èlò yìí yóò fi ara rẹ̀ pamọ́, yóò sì ṣiṣẹ́ láì lo dátà.", saving:"Ń fipamọ́ fún lílò láì lo dátà...", ready:"Ó ti ṣetán láti lò láì lo dátà", share:"Pín ibi tí mo wà", text:"Fi ọ̀rọ̀ ránṣẹ́ pẹ̀lú ibi tí mo wà", online:"Fi ìkìlọ̀ ránṣẹ́ lórí íntánẹ́ẹ̀tì", needdata:"Tan dátà alágbèéká rẹ láti lo èyí.", notyet:"A kò tíì ṣètò èyí. Jọ̀wọ́ pè tàbí fi ọ̀rọ̀ ránṣẹ́.", lookfor:"Wá a lójú ọ̀nà rẹ", photo:"Fọ́tò máa wà níbí", walk:"Ìrìn àyẹ̀wò", nolocation:"A kò rí ibi tí o wà.", at:"Ní", theme:"Ìmọ́lẹ̀ tàbí òkùnkùn", tagline:"Wá ọ̀nà rẹ ní OAU", tagsub:"Àwọn ibi, ìtọ́sọ́nà ní ìgbésẹ̀ kọ̀ọ̀kan, àti ìrànwọ́ pàjáwìrì. Ó ń ṣiṣẹ́ láì lo dátà.", recent:"Àwọn tí o wá láìpẹ́", clear:"Pa rẹ́", tfind:"Wá", tsafe:"Ààbò", aka:"A tún ń pè é ní", closest:"Kò sí èyí tó bá a mu gan-an. Àwọn tó súnmọ́ ọ:", share:"Pín ibí yìí", copied:"A ti da ìjápọ̀ kọ", longwalk:"Ìrìn jíjìn ni. Gbé omi dání, kí o sì wọ bọ́ọ̀sì tàbí kẹ̀kẹ́ tó bá ń lọ sí ọ̀nà rẹ.", noroute:"Kò sí ọ̀nà síbẹ̀", fresh:"Ṣé o ṣẹ̀ṣẹ̀ dé OAU? Ìtọ́sọ́nà akẹ́kọ̀ọ́ tuntun", freshsub:"Àwọn ibi àkọ́kọ́ tí o máa wá, ní ìtẹ̀léra", found:"ti rí", go:"Lọ", fdraft:"Àkọ́kọ́ ni àtòjọ àti ìmọ̀ràn yìí. Ẹgbẹ́ gbọ́dọ̀ yẹ̀ wọ́n wò.", locdenied:"Ibi tí o wà ti di títì fún ohun èlò yìí. Tan án nínú ètò aṣàwákiri rẹ, tàbí yan ibi tí o wà nínú àtòjọ.", loctimeout:"GPS ń pẹ́ jù. Jáde síta tàbí gbìyànjú lẹ́ẹ̀kan sí i."},
  pcm: {find:"Find place", sos:"Emergency", here:"Use where I dey now", where:"Where you dey now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search name of place...", map:"See map", note:"This one no dey call anybody. E go help you call and show wetin to do.",
    nopath:"We never save road yet. Landmark:", pending:"Dem never confirm this advice.", tbc:"Dem never confirm the number", arrived:"You don reach",
    start:"Start dey waka go", straight:"Waka straight go", left:"Turn left go", right:"Turn right go", langname:"Pidgin", wai:"Where I dey?", near:"You dey near:", pickhere:"Pick where you dey: ", allplaces:"Show all places", lessons:"Stay safe: wetin to do", draft:"Draft. The correct office never check am yet.", firstopen:"Turn on your data one time. The app go save itself, then e go work without data.", saving:"E dey save for offline...", ready:"E don ready, no need data", share:"Share where I dey", text:"Text with where I dey", online:"Send alert for internet", needdata:"Turn on your data to use this one.", notyet:"This one never ready. Abeg call or text.", lookfor:"Look am for your way", photo:"Photo go dey here", walk:"Test waka", nolocation:"We no fit see where you dey.", at:"For", theme:"Light or dark", tagline:"Find your way for OAU", tagsub:"Places, direction step by step, and help for emergency. E dey work without data.", recent:"Places you find before", clear:"Clear am", tfind:"Find", tsafe:"Stay safe", aka:"Dem dey also call am", closest:"No exact match. Places wey near am:", share:"Share this place", copied:"Link don copy", longwalk:"Na long waka. Carry water, and enter bus or keke if one dey go your side.", noroute:"No road yet", fresh:"You just come OAU? Freshers trail", freshsub:"First places to find, one by one", found:"don find", go:"Go", fdraft:"Draft list and tips. The team go check am.", locdenied:"Location dey off for this app. On am for your browser settings, or pick where you dey from the list.", loctimeout:"GPS dey take too long. Comot go outside or try again."}
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
  $("themebtn").innerHTML = darkNow() ? SUN : MOON;
}
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
const card = (p, extra) => '<li><button data-id="' + p.id + '">' + icon("mk", M(p.category)) + "<div><b>" + p.name + "</b><span>" + tr(p.landmark) + "</span>" + (extra || "") + "</div></button></li>";
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
  applyLang(); show(store.get("lang") ? "find" : "lang"); warm();
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
  $("back").hidden = pg || id === "lang";
  $("lclose").hidden = !store.get("lang");
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
  $("q").placeholder = t("search"); $("all").setAttribute("aria-label", t("allplaces"));
  $("langbtn").innerHTML = I("globe") + '<span class="lt">' + t("langname") + "</span>"; $("langbtn").setAttribute("aria-label", t("langname"));
  $("themebtn").setAttribute("aria-label", t("theme"));
  $("mapbtn").innerHTML = icon("ic", I("map")) + t("map");
  $("devbar").hidden = !places.some(p => p.sample);
  topics(); if (topic && !$("slides").hidden) slide();
  cats(); list(); ecats(); if (placeId) startHead(); if (route) { renderStep(false); startNavSummary(); }
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
  $("all").innerHTML = I(all ? "layout-grid" : "list"); $("all").setAttribute("aria-pressed", all);
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
function pick(id) { remember(id); placeId = id; startHead(); show("start"); }
function startHead() {
  const p = graph.byId[placeId];
  $("sico").innerHTML = M(p.category); $("sname").textContent = p.name; $("slm").textContent = tr(p.landmark); $("spic").innerHTML = pic(p);
  const d = Route.distancesFrom(graph, placeId);
  $("starts").innerHTML = shown().filter(x => x.id !== placeId)
    .map(x => card(x, '<em class="far">' + (d[x.id] != null ? away(d[x.id]) : t("noroute")) + "</em>")).join("");
  $("share").innerHTML = SHARE + t("share");
  $("starts").querySelectorAll("button").forEach(b => { b.onclick = () => startNav(b.dataset.id); });
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
  startNavSummary();
  show("nav"); renderStep(true); map(route && route.ids);
}
// Total distance and time at the top of the directions, and a warning for walks of 10 minutes or more.
function startNavSummary() {
  $("summary").innerHTML = route ? "<b>" + away(route.meters) + "</b>" + (route.meters / WALK >= 10 ? '<small class="warn">' + I("flame") + t("longwalk") + "</small>" : "") : "";
}
function renderStep(say) {
  const n = steps.length, done = si >= n, s = steps[si];
  $("dots").innerHTML = Array.from({length: n + 1}, (_, i) => '<i class="' + (i <= si ? "on" : "") + '"></i>').join("");
  $("prev").innerHTML = I("arrow-left"); $("next").innerHTML = I("arrow-right");
  $("prev").disabled = si === 0; $("next").disabled = done || !route;
  if (!route) { $("npic").innerHTML = ""; $("bigico").innerHTML = I("map-pin"); $("stepText").innerHTML = "<small>" + t("nopath") + "</small>" + tr(graph.byId[placeId].landmark); seq = []; return; }
  $("bigico").innerHTML = I(done ? "flag" : s.turn);
  $("npic").innerHTML = pic(graph.byId[done ? placeId : (s.near || s.to)]);   // at a turn, show the landmark you turn at
  $("stepText").innerHTML = done ? "<b>" + t("arrived") + "</b>"
    : (graph.byId[s.to].kind === "landmark" ? '<small class="lm">' + t("lookfor") + "</small>" : "") + (s.near ? '<small class="lm">' + t("at") + " " + nameOf(s.near) + "</small>" : "") + "<small>" + t(s.turn) + '</small><span class="dest">' + icon("mk", M(graph.byId[s.to].category)) + "<b>" + nameOf(s.to) + "</b></span><small>" + s.meters + " m</small>";
  seq = done ? [{key: "arrive", text: t("arrived")}] : [{key: s.turn, text: t(s.turn)}, {key: s.to, text: nameOf(s.to)}];
  hiStep();
}
// The map is drawn from our own data, so it works offline: OpenStreetMap roads in grey, footpaths the Field team
// walked as green dashes, every place as a small dot, then the route on top with pins at both ends and at turn landmarks.
let proj, stepLine;
function map(ids) {
  if (!lm) {
    lm = L.map("map", {crs: L.CRS.Simple, minZoom: -3, maxZoom: 4, zoomSnap: 0.25, attributionControl: false});
    let lat0 = Infinity, lng0 = Infinity;
    places.forEach(p => { lat0 = Math.min(lat0, p.lat); lng0 = Math.min(lng0, p.lng); });
    const kx = Math.cos(lat0 * Math.PI / 180);
    proj = p => [(p.lat - lat0) * 1e5, (p.lng - lng0) * kx * 1e5];
    const roads = [], foot = [];
    paths.forEach(([a, b]) => { const A = graph.byId[a], B = graph.byId[b]; (A.osm || B.osm ? roads : foot).push([proj(A), proj(B)]); });
    L.polyline(roads, {className: "mroad", interactive: false}).addTo(lm);
    L.polyline(foot, {className: "mfoot", interactive: false}).addTo(lm);
    shown().forEach(p => L.circleMarker(proj(p), {radius: 5, className: "mdot k-" + slug(p.category || ""), interactive: false}).addTo(lm));
    lg = L.layerGroup().addTo(lm);
    lm.on("dragstart", () => { follow = false; $("locate").setAttribute("aria-pressed", "false"); });
  }
  lg.clearLayers(); mb = null; if (!ids) return;
  const pts = ids.map(i => graph.byId[i]);
  L.polyline(pts.map(proj), {className: "mroute", interactive: false}).addTo(lg);
  stepLine = L.polyline([], {className: "mstep", interactive: false}).addTo(lg);
  const pin = (p, cls, ico) => L.marker(proj(p), {icon: L.divIcon({className: "", iconSize: null, html: '<div class="pin' + cls + '"><span>' + ico + "</span><em>" + p.name + "</em></div>"})}).addTo(lg);
  [...new Set(steps.map(s => s.near).filter(Boolean))].forEach(id => pin(graph.byId[id], " on", M(graph.byId[id].category)));
  pin(pts[0], "", I("footprints"));
  pin(pts[pts.length - 1], " focus", M(pts[pts.length - 1].category));
  mb = L.latLngBounds(pts.map(proj)).pad(0.2); fit(); hiStep(true);
}
// The step you are on is drawn on top of the route as moving dots, and the map shows that part of the walk
// (unless the map is following your GPS).
function hiStep(first) {
  if (!lm || !stepLine || !route) return;
  const s = steps[si];
  if (!s) { stepLine.setLatLngs([]); return; }
  const seg = route.ids.slice(s.from, s.end + 1).map(i => proj(graph.byId[i]));
  stepLine.setLatLngs(seg);
  if (!first && !follow && $("mapbox").open && lm.getSize().x) lm.fitBounds(L.latLngBounds(seg).pad(0.4), {maxZoom: 1.5});
}
// "You" on the map: a blue dot that moves with your GPS, an arrow for the way you face, and a pale circle for
// how accurate the GPS is. It starts when you tap the button on the map (or chose "Use my location"), stops when
// you leave the directions, and your position never leaves the phone.
let watch = null, youM = null, accC = null, follow = false;
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
  watch = null; follow = false; $("locate").setAttribute("aria-pressed", "false");
  removeEventListener("deviceorientationabsolute", onTurn); removeEventListener("deviceorientation", onTurn);
  if (youM) { youM.remove(); accC.remove(); youM = accC = null; }
  rot = null;
}
function onPos(pos) {
  if (!lm) return;
  const p = proj({lat: pos.coords.latitude, lng: pos.coords.longitude});
  if (!youM) {
    accC = L.circle(p, {radius: 1, className: "me-acc", interactive: false}).addTo(lm);
    youM = L.marker(p, {interactive: false, zIndexOffset: 1000, icon: L.divIcon({className: "", iconSize: null, html: '<div class="you"><s></s><i></i></div>'})}).addTo(lm);
  }
  youM.setLatLng(p); accC.setLatLng(p); accC.setRadius(pos.coords.accuracy / M_PER_UNIT);
  if (pos.coords.heading != null && pos.coords.speed > 0.5) face(pos.coords.heading);   // walking: GPS knows the direction
  if (follow) lm.panTo(p);
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
function face(h) {
  rot = rot === null ? h : rot + ((h - rot % 360 + 540) % 360) - 180;
  if (turnRaf) return;
  turnRaf = requestAnimationFrame(() => {
    turnRaf = 0;
    const el = youM && youM.getElement() && youM.getElement().querySelector(".you");
    if (el) { el.classList.add("dir"); el.style.setProperty("--h", rot.toFixed(1) + "deg"); }
  });
}
function fit() { if (lm && mb) { lm.invalidateSize(); if (lm.getSize().x) lm.fitBounds(mb); } }
function ecats() {
  const cs = emerg.categories; if (!cs.length) return; ecat = ecat || cs[0].id;
  $("ecats").innerHTML = cs.map(c => '<button data-c="' + c.id + '" aria-pressed="' + (c.id === ecat) + '">' + I(EICO[c.id]) + "<b>" + tr(c.label) + "</b></button>").join("");
  $("ecats").querySelectorAll("button").forEach(b => { b.onclick = () => { ecat = b.dataset.c; ecats(); }; });
  const c = cs.find(x => x.id === ecat), g = c.guidance;
  $("ebody").innerHTML = c.contacts.map(k => k.number
    ? '<a class="call" href="tel:' + k.number.replace(/[^\d+]/g, "") + '">' + I("phone") + " " + tr(k.label) + ": " + k.number + "</a>"
    : '<span class="tbc">' + tr(k.label) + " (" + t("tbc") + ")</span>").join("") +
    '<button id="wai" class="secondary">' + icon("ic", I("map-pin")) + t("wai") + '</button><p id="waimsg"></p>' +
    (g.reviewed && g.steps.length ? "<ol>" + g.steps.map(s => "<li>" + tr(s) + "</li>").join("") + "</ol>" : '<p class="tbc">' + t("pending") + "</p>");
  $("wai").onclick = whereAmI;
}
// Saves the photos on the phone so they work offline.
async function warm() {
  if (!("serviceWorker" in navigator) || window.__DATA) return;
  $("status").innerHTML = icon("ic", I("circle-check")) + t("saving");
  await navigator.serviceWorker.ready;
  await Promise.allSettled(shown().filter(p => p.photo).map(p => fetch(p.photo)));
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
// Safety lessons: one step per slide, big picture, previous/next buttons.
function topics() {
  $("topics").innerHTML = lessons.map(l => '<button data-id="' + l.id + '">' + I(l.icon) + "<b>" + tr(l.title) + "</b></button>").join("");
  $("topics").querySelectorAll("button").forEach(b => { b.onclick = () => { topic = lessons.find(l => l.id === b.dataset.id); li = 0; show("slides"); slide(); }; });
}
function renderSlides() {
  const s = topic.steps[li];
  $("embc").innerHTML = '<div class="embla__slide"><div class="lbig"><div class="lico">' + I(s.icon) + '</div></div><p class="lt">' + tr(s.text) + "</p></div>";
}
function slide() {
  renderSlides();
  const n = topic.steps.length;
  $("ltitle").textContent = tr(topic.title); $("lcount").textContent = (li + 1) + " / " + n; $("ldraft").textContent = t("draft");
  $("ldots").innerHTML = topic.steps.map((_, i) => '<i class="' + (i <= li ? "on" : "") + '"></i>').join("");
  $("lprev").innerHTML = I("arrow-left"); $("lnext").innerHTML = I("arrow-right"); $("lprev").disabled = li === 0; $("lnext").disabled = li === n - 1;
}
document.querySelectorAll("[data-go]").forEach(b => { b.onclick = () => show(b.dataset.go); });
document.querySelectorAll("#lang [data-lang]").forEach(b => { b.onclick = () => {
  lang = b.dataset.lang; store.set("lang", lang); applyLang(); warm();
  if (hist.length > 1) history.back(); else show("find", false, true);   // opened from the header: just go back
  if (shared) { pick(shared); shared = null; }
}; });
$("lclose").onclick = () => history.back();
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
$("share").onclick = sharePlace;
$("freshcard").onclick = () => { freshList(); show("freshers"); }; $("rclear").onclick = () => { store.set("recent", "[]"); list(); }; $("catpill").onclick = () => { cat = ""; all = false; list(); }; $("all").onclick = () => { all = !all; cat = ""; list(); };
$("prev").onclick = () => { si = Math.max(0, si - 1); renderStep(true); };
$("next").onclick = () => { si++; renderStep(true); };
const step = d => { li = Math.min(topic.steps.length - 1, Math.max(0, li + d)); slide(); };
$("lprev").onclick = () => step(-1); $("lnext").onclick = () => step(1);
$("mapbox").ontoggle = () => requestAnimationFrame(fit);
$("locate").onclick = () => {
  if (watch === null) { askCompass(); startWatch(); }
  follow = !follow || !youM; $("locate").setAttribute("aria-pressed", follow);
  if (follow && youM) lm.setView(youM.getLatLng(), Math.max(lm.getZoom(), 1));
};
$("here").onclick = () => {
  if (!navigator.geolocation) return;
  askCompass();
  navigator.geolocation.getCurrentPosition(pos => {
    const m = {lat: pos.coords.latitude, lng: pos.coords.longitude}; let best = null, bd = Infinity;
    shown().filter(p => p.id !== placeId).forEach(p => { const d = Route.haversine(m, p); if (d < bd) { bd = d; best = p; } });
    if (best) { startNav(best.id); startWatch(); }
  }, e => { $("status").textContent = locErr(e); });
};
document.querySelectorAll("[data-ico]").forEach(e => { e.innerHTML = I(e.dataset.ico); });
$("back").innerHTML = I("arrow-left"); $("locate").innerHTML = I("locate-fixed"); $("locate").setAttribute("aria-label", t("here"));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
load();
