// app.js: picture-first, one step at a time. Every screen word is translated in all 3 languages.
// All Yoruba and Pidgin lines are FIRST DRAFTS: native speakers must check them.
// Safe storage: some viewers (chat previews, sandboxes) block it. The app must still open.
const store = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
window.addEventListener("error", e => { const b = document.getElementById("status"); if (b) b.textContent = "Error: " + e.message + ". Please reload."; });
const S = {
  en: {find:"Find a place", sos:"Emergency", here:"Use my location", where:"Where are you now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search name of place...", map:"See map", note:"This screen does not alert anyone. It helps you call and shows what to do.",
    nopath:"No walking route saved yet. Landmark:", pending:"Advice not yet confirmed.", tbc:"Number to be confirmed", arrived:"You have arrived",
    start:"Start by walking to", straight:"Go straight to", left:"Turn left towards", right:"Turn right towards", langname:"English", wai:"Where am I?", near:"You are near:", pickhere:"Pick where you are: ", allplaces:"Show all places", lessons:"Stay safe: what to do", draft:"Draft. Not yet checked by the responsible office.", firstopen:"Turn on mobile data once. The app saves itself, then works without data.", saving:"Saving for offline use...", ready:"Ready to use without data", share:"Share my location", text:"Text with my location", online:"Send alert online", needdata:"Turn on mobile data to use this.", notyet:"Online alert is not set up yet. Please call or text.", lookfor:"Look for it on your way", photo:"Photo goes here", walk:"Demo walk", nolocation:"Could not find your location.", at:"At"},
  yo: {find:"Wá ibì kan", sos:"Pàjáwìrì", here:"Lo ibi tí mo wà", where:"Níbo ni o wà báyìí?", listen:"Gbọ́", live:"Ọfà ìtọ́sọ́nà",
    turn:"Yí fóònù rẹ", search:"Wá orúkọ ibì kan...", map:"Wo àwòrán ilẹ̀", note:"Èyí kò ní ránṣẹ́ sí ẹnikẹ́ni. Ó ń ràn ọ́ lọ́wọ́ láti pe ìrànwọ́, ó sì fi ohun tí o máa ṣe hàn ọ́.",
    nopath:"A kò tíì fi ọ̀nà pamọ́. Àmì ibi:", pending:"A kò tíì jẹ́rìí ìmọ̀ràn yìí.", tbc:"A ṣì ń jẹ́rìí nọ́ńbà náà", arrived:"O ti dé",
    start:"Bẹ̀rẹ̀ nípa rírìn lọ sí", straight:"Máa lọ tààrà sí", left:"Yà sí òsì sí", right:"Yà sí ọ̀tún sí", langname:"Yorùbá", wai:"Níbo ni mo wà?", near:"O wà nítòsí:", pickhere:"Yan ibi tí o wà: ", allplaces:"Fi gbogbo ibi hàn", lessons:"Dúró láìséwu: ohun tí o máa ṣe", draft:"Àkọ́kọ́. Ọ́fíìsì tó yẹ kò tíì yẹ̀ ẹ́ wò.", firstopen:"Tan dátà alágbèéká rẹ lẹ́ẹ̀kan. Ohun èlò yìí yóò fi ara rẹ̀ pamọ́, yóò sì ṣiṣẹ́ láì lo dátà.", saving:"Ń fipamọ́ fún lílò láì lo dátà...", ready:"Ó ti ṣetán láti lò láì lo dátà", share:"Pín ibi tí mo wà", text:"Fi ọ̀rọ̀ ránṣẹ́ pẹ̀lú ibi tí mo wà", online:"Fi ìkìlọ̀ ránṣẹ́ lórí íntánẹ́ẹ̀tì", needdata:"Tan dátà alágbèéká rẹ láti lo èyí.", notyet:"A kò tíì ṣètò èyí. Jọ̀wọ́ pè tàbí fi ọ̀rọ̀ ránṣẹ́.", lookfor:"Wá a lójú ọ̀nà rẹ", photo:"Fọ́tò máa wà níbí", walk:"Ìrìn àyẹ̀wò", nolocation:"A kò rí ibi tí o wà.", at:"Ní"},
  pcm: {find:"Find place", sos:"Emergency", here:"Use where I dey now", where:"Where you dey now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search name of place...", map:"See map", note:"This one no dey call anybody. E go help you call and show wetin to do.",
    nopath:"We never save road yet. Landmark:", pending:"Dem never confirm this advice.", tbc:"Dem never confirm the number", arrived:"You don reach",
    start:"Start dey waka go", straight:"Waka straight go", left:"Turn left go", right:"Turn right go", langname:"Pidgin", wai:"Where I dey?", near:"You dey near:", pickhere:"Pick where you dey: ", allplaces:"Show all places", lessons:"Stay safe: wetin to do", draft:"Draft. The correct office never check am yet.", firstopen:"Turn on your data one time. The app go save itself, then e go work without data.", saving:"E dey save for offline...", ready:"E don ready, no need data", share:"Share where I dey", text:"Text with where I dey", online:"Send alert for internet", needdata:"Turn on your data to use this one.", notyet:"This one never ready. Abeg call or text.", lookfor:"Look am for your way", photo:"Photo go dey here", walk:"Test waka", nolocation:"We no fit see where you dey.", at:"For"}
};
const CAT = {Libraries:{yo:"Ibi ìkàwé",pcm:"Library"}, "Essential Services":{yo:"Àwọn iṣẹ́ pàtàkì",pcm:"Important services"}, Gates:{yo:"Ẹnu ọ̀nà",pcm:"Gate"},
  "Lecture Theatres":{yo:"Gbọ̀ngàn ìkẹ́kọ̀ọ́",pcm:"Lecture hall"}, Faculties:{yo:"Ẹ̀ka ẹ̀kọ́",pcm:"Faculty"}, Administration:{yo:"Ọ́fíìsì ìṣàkóso",pcm:"Admin"},
  Hostels:{yo:"Ilé ibùgbé akẹ́kọ̀ọ́",pcm:"Hostel"}, Sports:{yo:"Eré ìdárayá",pcm:"Sports ground"}, "Food & Shops":{yo:"Oúnjẹ àti ọjà",pcm:"Food and shops"}};
const EICO = {medical:"heart-pulse", fire:"flame", security:"shield-alert"};
const $ = id => document.getElementById(id);
let places = [], paths = [], emerg = {categories: []}, lessons = [], topic = null, li = 0, all = false, graph, placeId = null, cat = "", ecat = null, hist = ["home"];
let lang = store.get("lang"), session = 0, cur = null, route = null, steps = [], si = 0, seq = [];
let lm, lg, mb;
const t = k => (S[lang] || S.en)[k] || S.en[k];
const tr = o => typeof o === "string" ? o : (o && (o[lang] || o.en)) || "";
const ct = c => (CAT[c] && CAT[c][lang]) || c;
const data = n => window.__DATA ? Promise.resolve(window.__DATA[n]) : fetch("data/" + n + ".json").then(r => r.json());
const shown = () => places.filter(p => !p.hidden && p.verified);
const nameOf = id => graph.byId[id].name;
const icon = (cls, svg) => '<i class="' + cls + '">' + svg + "</i>";
const pic = p => p.photo ? '<img src="' + p.photo + '" alt="" width="640" height="360">' : '<div class="ph">' + I("camera") + "<span>" + t("photo") + "</span>" + (p.sample ? '<small class="dev">DEV: add real photo</small>' : "") + "</div>";
const card = p => '<li><button data-id="' + p.id + '">' + icon("mk", M(p.category)) + "<div><b>" + p.name + "</b><span>" + tr(p.landmark) + "</span></div></button></li>";

async function load() {
  [places, paths, emerg, lessons] = await Promise.all(["places", "paths", "emergency", "lessons"].map(data));
  graph = Route.buildGraph(places, paths);
  if (!lang) lang = "en";
  applyLang(); show(store.get("lang") ? "home" : "lang"); warm();
}
function show(id, back) {
  if (!back && hist[hist.length - 1] !== id) hist.push(id);
  document.querySelectorAll(".screen").forEach(s => { s.hidden = s.id !== id; });
  $("back").hidden = id === "home" || id === "lang";
}
function applyLang() {
  document.documentElement.lang = lang === "pcm" ? "en" : lang;
  document.querySelectorAll("[data-t]").forEach(e => { e.innerHTML = (e.dataset.i ? icon("ic", I(e.dataset.i)) : "") + t(e.dataset.t); });
  $("q").placeholder = t("search"); $("all").setAttribute("aria-label", t("allplaces"));
  $("langbtn").innerHTML = I("globe") + " " + t("langname");
  $("mapbtn").innerHTML = icon("ic", I("map")) + t("map");
  $("devbar").hidden = !places.some(p => p.sample);
  topics(); if (topic && !$("slides").hidden) slide();
  cats(); list(); ecats(); if (placeId) startHead(); if (route) renderStep(false);
}
function cats() {
  const cs = [...new Set(shown().map(p => p.category))].sort();
  $("cats").innerHTML = cs.map(c => '<button data-c="' + c + '">' + icon("mk", M(c)) + "<b>" + ct(c) + "</b></button>").join("");
  $("cats").querySelectorAll("button").forEach(b => { b.onclick = () => { cat = b.dataset.c; list(); }; });
}
function list() {
  const q = $("q").value.trim().toLowerCase(), on = cat || q || all;
  $("cats").hidden = !!on; $("list").hidden = !on; $("catpill").hidden = !cat;
  $("catpill").innerHTML = cat ? icon("mk", M(cat)) + ct(cat) + " " + I("x") : "";
  $("all").innerHTML = I(all ? "layout-grid" : "list"); $("all").setAttribute("aria-pressed", all);
  $("list").innerHTML = shown().filter(p => (!cat || p.category === cat) &&
    (!q || [p.name].concat(p.aliases || []).some(x => x.toLowerCase().includes(q)))).sort((x, y) => x.name.localeCompare(y.name)).map(card).join("");
  $("list").querySelectorAll("button").forEach(b => { b.onclick = () => pick(b.dataset.id); });
}
function pick(id) { placeId = id; startHead(); show("start"); }
function startHead() {
  const p = graph.byId[placeId];
  $("sico").innerHTML = M(p.category); $("sname").textContent = p.name; $("slm").textContent = tr(p.landmark); $("spic").innerHTML = pic(p);
  $("starts").innerHTML = shown().filter(x => x.id !== placeId).map(card).join("");
  $("starts").querySelectorAll("button").forEach(b => { b.onclick = () => startNav(b.dataset.id); });
}
function startNav(from) {
  route = Route.shortestPath(graph, from, placeId);
  steps = route ? Route.directions(graph, route.ids) : []; si = 0;
  show("nav"); renderStep(true); map(route && route.ids);
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
}
function map(ids) {
  if (!lm) { lm = L.map("map", {crs: L.CRS.Simple, minZoom: -3, maxZoom: 3, zoomSnap: 0.25, attributionControl: false}); lg = L.layerGroup().addTo(lm); }
  lg.clearLayers(); mb = null; if (!ids) return;
  const pts = ids.map(i => graph.byId[i]), lat0 = Math.min(...pts.map(p => p.lat)), lng0 = Math.min(...pts.map(p => p.lng));
  const kx = Math.cos(lat0 * Math.PI / 180), P = p => [(p.lat - lat0) * 1e5, (p.lng - lng0) * kx * 1e5];
  pts.forEach((p, i) => {
    const end = i === pts.length - 1, st = i === 0; if (p.hidden && !end && !st) return;
    const html = '<div class="pin' + (end ? " focus" : st ? "" : " on") + '"><span>' + (st ? I("footprints") : M(p.category)) + "</span><em>" + p.name + "</em></div>";
    L.marker(P(p), {icon: L.divIcon({className: "", iconSize: null, html})}).addTo(lg);
  });
  mb = L.latLngBounds(pts.map(P)).pad(0.25); fit();
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
document.querySelectorAll("#lang button").forEach(b => { b.onclick = () => { lang = b.dataset.lang; store.set("lang", lang); applyLang(); show("home"); warm(); }; });
$("langbtn").onclick = () => show("lang");
$("back").onclick = () => { hist.pop(); show(hist[hist.length - 1] || "home", true); };
$("q").oninput = list; $("catpill").onclick = () => { cat = ""; all = false; list(); }; $("all").onclick = () => { all = !all; cat = ""; list(); };
$("prev").onclick = () => { si = Math.max(0, si - 1); renderStep(true); };
$("next").onclick = () => { si++; renderStep(true); };
const step = d => { li = Math.min(topic.steps.length - 1, Math.max(0, li + d)); slide(); };
$("lprev").onclick = () => step(-1); $("lnext").onclick = () => step(1);
$("mapbox").ontoggle = () => requestAnimationFrame(fit);
$("here").onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const m = {lat: pos.coords.latitude, lng: pos.coords.longitude}; let best = null, bd = Infinity;
    shown().filter(p => p.id !== placeId).forEach(p => { const d = Route.haversine(m, p); if (d < bd) { bd = d; best = p; } });
    if (best) startNav(best.id);
  }, () => { $("status").textContent = t("nolocation"); });
};
document.querySelectorAll("[data-ico]").forEach(e => { e.innerHTML = I(e.dataset.ico); });
$("back").innerHTML = I("arrow-left");
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
load();
