// app.js: picture-first, one step at a time. Every screen word is translated in all 3 languages.
// All Yoruba and Pidgin lines are FIRST DRAFTS: native speakers must check them.
// Safe storage: some viewers (chat previews, sandboxes) block it. The app must still open.
const store = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
window.addEventListener("error", e => { const b = document.getElementById("status"); if (b) b.textContent = "Error: " + e.message + ". Please reload."; });
const S = {
  en: {find:"Find a place", sos:"Emergency", here:"Use my location", where:"Where are you now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search a place...", map:"See map", note:"This screen does not alert anyone. It helps you call and shows what to do.",
    nopath:"No walking route saved yet. Landmark:", pending:"Advice not yet confirmed.", tbc:"Number to be confirmed", arrived:"You have arrived",
    start:"Start by walking to", straight:"Go straight to", left:"Turn left towards", right:"Turn right towards", langname:"English", wai:"Where am I?", near:"You are near:", pickhere:"Pick where you are: ", allplaces:"Show all places", lessons:"Stay safe: what to do", draft:"First version. Being checked with", firstopen:"Turn on mobile data once. The app saves itself, then works without data.", saving:"Saving for offline use...", ready:"Ready to use without data", share:"Share my location", text:"Text with my location", online:"Send alert online", needdata:"Turn on mobile data to use this.", notyet:"Online alert is not set up yet. Please call or text.", lookfor:"Look for it on your way", photo:"Photo goes here", walk:"Demo walk", nolocation:"Could not find your location.", at:"At", theme:"Light or dark", tagline:"Find your way around OAU", tagsub:"Places, step-by-step directions and emergency help. Works without data.", recent:"Recent", clear:"Clear", tfind:"Find", tsafe:"Stay safe", aka:"Also called", closest:"No exact match. Closest places:", share:"Share this place", copied:"Link copied", longwalk:"Long walk. Carry water, and take a bus or keke if one is going your way.", noroute:"No route yet", fresh:"New to OAU? Freshers trail", freshsub:"The first places to find, in order", found:"found", go:"Go", fdraft:"Draft list and tips. The team must check them.", wheresub:"Let your phone find you, or tap a place you can see.", seeplace:"Or tap a place you can see", skip:"Skip for now", whereto:"Where do you want to go?", youat:"You are at", change:"Change", setwhere:"Tap to say where you are", you:"You", startpin:"Start", herecard:"You are here", pressknow:"Press me to know", to:"to", towards:"heading towards", showme:"Show me", following:"Following you", far:"Your phone says you are {d} away from this route. Directions start at {name}: walk there first, or pick where you are again.", whattodo:"What to do", follow:"Follow me", walkfor:"Walk", tleft:"Turn left", tright:"Turn right", tstraight:"Go straight on", stepn:"Step", finding:"Finding you...", nearby:"Near", going:"Going to", gpsnote:"Works without data", typename:"Type a name, or scroll", locdenied:"Location is off for this app. Turn it on in your browser settings, or pick where you are from the list.", loctimeout:"GPS is taking too long. Step outside or try again.", popular:"Popular places", browse:"Browse by type", tips:"Safety tips: what to do", guideme:"Guide me", guidesub:"Big arrow, voice and a buzz at every turn", inm:"In {d}", arrivein:"Your destination is ahead", arrivedat:"You have arrived at", walkpath:"Walk to the path first", metres:"metres", then:"then", voiceon:"Voice on", voiceoff:"Voice off", practice:"Practice walk", stopwalk:"Stop practice", practicing:"Practice walk: the app is walking the route for you.", holdflat:"Hold your phone flat, with the top pointing ahead.", nocompass:"No compass on this phone: follow the turn sign and the photo.", acc:"Your GPS is accurate to about {m} m", areyouhere:"Are you here?", yeshere:"Yes, I am here", orthese:"Not right? Tap where you are:", outside:"Your phone says you are {d} from the nearest mapped place. If you are not on campus, pick a place below to try the app.", steplist:"See all steps and the map", offroute:"You are {d} from the route. Walk to it first.", novoice:"This phone has no Yoruba voice, so directions are shown, not spoken.", done:"Done", facestraight:"Walk straight ahead", faceleft:"Turn left first", faceright:"Turn right first", facearound:"Turn around first", facehint:"From the way your phone is facing now"},
  yo: {find:"Wá ibì kan", sos:"Pàjáwìrì", here:"Lo ibi tí mo wà", where:"Níbo ni o wà báyìí?", listen:"Gbọ́", live:"Ọfà ìtọ́sọ́nà",
    turn:"Yí fóònù rẹ", search:"Wá orúkọ ibì kan...", map:"Wo àwòrán ilẹ̀", note:"Èyí kò ní ránṣẹ́ sí ẹnikẹ́ni. Ó ń ràn ọ́ lọ́wọ́ láti pe ìrànwọ́, ó sì fi ohun tí o máa ṣe hàn ọ́.",
    nopath:"A kò tíì fi ọ̀nà pamọ́. Àmì ibi:", pending:"A kò tíì jẹ́rìí ìmọ̀ràn yìí.", tbc:"A ṣì ń jẹ́rìí nọ́ńbà náà", arrived:"O ti dé",
    start:"Bẹ̀rẹ̀ nípa rírìn lọ sí", straight:"Máa lọ tààrà sí", left:"Yà sí òsì sí", right:"Yà sí ọ̀tún sí", langname:"Yorùbá", wai:"Níbo ni mo wà?", near:"O wà nítòsí:", pickhere:"Yan ibi tí o wà: ", allplaces:"Fi gbogbo ibi hàn", lessons:"Dúró láìséwu: ohun tí o máa ṣe", draft:"Ẹ̀dà àkọ́kọ́. À ń yẹ̀ ẹ́ wò pẹ̀lú", firstopen:"Tan dátà alágbèéká rẹ lẹ́ẹ̀kan. Ohun èlò yìí yóò fi ara rẹ̀ pamọ́, yóò sì ṣiṣẹ́ láì lo dátà.", saving:"Ń fipamọ́ fún lílò láì lo dátà...", ready:"Ó ti ṣetán láti lò láì lo dátà", share:"Pín ibi tí mo wà", text:"Fi ọ̀rọ̀ ránṣẹ́ pẹ̀lú ibi tí mo wà", online:"Fi ìkìlọ̀ ránṣẹ́ lórí íntánẹ́ẹ̀tì", needdata:"Tan dátà alágbèéká rẹ láti lo èyí.", notyet:"A kò tíì ṣètò èyí. Jọ̀wọ́ pè tàbí fi ọ̀rọ̀ ránṣẹ́.", lookfor:"Wá a lójú ọ̀nà rẹ", photo:"Fọ́tò máa wà níbí", walk:"Ìrìn àyẹ̀wò", nolocation:"A kò rí ibi tí o wà.", at:"Ní", theme:"Ìmọ́lẹ̀ tàbí òkùnkùn", tagline:"Wá ọ̀nà rẹ ní OAU", tagsub:"Àwọn ibi, ìtọ́sọ́nà ní ìgbésẹ̀ kọ̀ọ̀kan, àti ìrànwọ́ pàjáwìrì. Ó ń ṣiṣẹ́ láì lo dátà.", recent:"Àwọn tí o wá láìpẹ́", clear:"Pa rẹ́", tfind:"Wá", tsafe:"Ààbò", aka:"A tún ń pè é ní", closest:"Kò sí èyí tó bá a mu gan-an. Àwọn tó súnmọ́ ọ:", share:"Pín ibí yìí", copied:"A ti da ìjápọ̀ kọ", longwalk:"Ìrìn jíjìn ni. Gbé omi dání, kí o sì wọ bọ́ọ̀sì tàbí kẹ̀kẹ́ tó bá ń lọ sí ọ̀nà rẹ.", noroute:"Kò sí ọ̀nà síbẹ̀", fresh:"Ṣé o ṣẹ̀ṣẹ̀ dé OAU? Ìtọ́sọ́nà akẹ́kọ̀ọ́ tuntun", freshsub:"Àwọn ibi àkọ́kọ́ tí o máa wá, ní ìtẹ̀léra", found:"ti rí", go:"Lọ", fdraft:"Àkọ́kọ́ ni àtòjọ àti ìmọ̀ràn yìí. Ẹgbẹ́ gbọ́dọ̀ yẹ̀ wọ́n wò.", wheresub:"Jẹ́ kí fóònù rẹ wá ọ, tàbí tẹ ibi tí o ń rí.", seeplace:"Tàbí tẹ ibi tí o ń rí", skip:"Fi sílẹ̀ ná", whereto:"Níbo ni o fẹ́ lọ?", youat:"O wà ní", change:"Yí i padà", setwhere:"Tẹ ibí láti sọ ibi tí o wà", you:"Ìwọ", startpin:"Ìbẹ̀rẹ̀", herecard:"O wà níbí", pressknow:"Tẹ̀ mí láti mọ̀", to:"lọ sí", towards:"sí ọ̀nà", showme:"Fi mí hàn", following:"Ó ń tẹ̀lé ọ", far:"Fóònù rẹ sọ pé o wà ní {d} sí ọ̀nà yìí. Ìtọ́sọ́nà bẹ̀rẹ̀ ní {name}: kọ́kọ́ rìn lọ síbẹ̀, tàbí tún yan ibi tí o wà.", whattodo:"Ohun tí o máa ṣe", follow:"Tẹ̀lé mi", walkfor:"Rìn", tleft:"Yà sí òsì", tright:"Yà sí ọ̀tún", tstraight:"Máa lọ tààrà", stepn:"Ìgbésẹ̀", finding:"À ń wá ọ...", nearby:"Nítòsí", going:"Ò ń lọ sí", gpsnote:"Ó ń ṣiṣẹ́ láì lo dátà", typename:"Kọ orúkọ kan, tàbí yí i sí ìsàlẹ̀", locdenied:"Ibi tí o wà ti di títì fún ohun èlò yìí. Tan án nínú ètò aṣàwákiri rẹ, tàbí yan ibi tí o wà nínú àtòjọ.", loctimeout:"GPS ń pẹ́ jù. Jáde síta tàbí gbìyànjú lẹ́ẹ̀kan sí i.", popular:"Àwọn ibi tí a máa ń lọ jù", browse:"Wò ó ní ìsọ̀rí", tips:"Ìmọ̀ràn ààbò: ohun tí o máa ṣe", guideme:"Tọ́ mi sọ́nà", guidesub:"Ọfà ńlá, ohùn, àti ìmì ní gbogbo ìyípadà", inm:"Ní {d}", arrivein:"Ibi tí ò ń lọ wà níwájú", arrivedat:"O ti dé", walkpath:"Kọ́kọ́ rìn lọ sí ọ̀nà náà", metres:"mítà", then:"lẹ́yìn náà", voiceon:"Ohùn wà", voiceoff:"Ohùn kò sí", practice:"Ìrìn àdánwò", stopwalk:"Dá àdánwò dúró", practicing:"Ìrìn àdánwò: ohun èlò náà ń rin ọ̀nà náà fún ọ.", holdflat:"Di fóònù rẹ mú ní pẹrẹsẹ, kí orí rẹ̀ kọjú síwájú.", nocompass:"Fóònù yìí kò ní kọ́ńpáàsì: tẹ̀lé àmì ìyípadà àti fọ́tò.", acc:"GPS rẹ péye tó nǹkan bí {m} m", areyouhere:"Ṣé ibí ni o wà?", yeshere:"Bẹ́ẹ̀ni, ibí ni mo wà", orthese:"Kò tọ̀nà? Tẹ ibi tí o wà:", outside:"Fóònù rẹ sọ pé o jìnnà ní {d} sí ibi tó súnmọ́ jù lórí àwòrán ilẹ̀. Tí o kò bá sí ní OAU, yan ibì kan nísàlẹ̀ láti dán ohun èlò náà wò.", steplist:"Wo gbogbo ìgbésẹ̀ àti àwòrán ilẹ̀", offroute:"O jìnnà ní {d} sí ọ̀nà náà. Kọ́kọ́ rìn lọ síbẹ̀.", novoice:"Fóònù yìí kò ní ohùn Yorùbá, nítorí náà a ń kọ ìtọ́sọ́nà sílẹ̀ dípò kí a sọ ọ́.", done:"Ó parí", facestraight:"Máa rìn lọ tààrà níwájú rẹ", faceleft:"Kọ́kọ́ yà sí òsì", faceright:"Kọ́kọ́ yà sí ọ̀tún", facearound:"Kọ́kọ́ yí padà sẹ́yìn", facehint:"Gẹ́gẹ́ bí fóònù rẹ ṣe kọjú báyìí"},
  pcm: {find:"Find place", sos:"Emergency", here:"Use where I dey now", where:"Where you dey now?", listen:"Listen", live:"Direction arrow",
    turn:"Turn your phone", search:"Search name of place...", map:"See map", note:"This one no dey call anybody. E go help you call and show wetin to do.",
    nopath:"We never save road yet. Landmark:", pending:"Dem never confirm this advice.", tbc:"Dem never confirm the number", arrived:"You don reach",
    start:"Start dey waka go", straight:"Waka straight go", left:"Turn left go", right:"Turn right go", langname:"Pidgin", wai:"Where I dey?", near:"You dey near:", pickhere:"Pick where you dey: ", allplaces:"Show all places", lessons:"Stay safe: wetin to do", draft:"First version. We dey check am with", firstopen:"Turn on your data one time. The app go save itself, then e go work without data.", saving:"E dey save for offline...", ready:"E don ready, no need data", share:"Share where I dey", text:"Text with where I dey", online:"Send alert for internet", needdata:"Turn on your data to use this one.", notyet:"This one never ready. Abeg call or text.", lookfor:"Look am for your way", photo:"Photo go dey here", walk:"Test waka", nolocation:"We no fit see where you dey.", at:"For", theme:"Light or dark", tagline:"Find your way for OAU", tagsub:"Places, direction step by step, and help for emergency. E dey work without data.", recent:"Places you find before", clear:"Clear am", tfind:"Find", tsafe:"Stay safe", aka:"Dem dey also call am", closest:"No exact match. Places wey near am:", share:"Share this place", copied:"Link don copy", longwalk:"Na long waka. Carry water, and enter bus or keke if one dey go your side.", noroute:"No road yet", fresh:"You just come OAU? Freshers trail", freshsub:"First places to find, one by one", found:"don find", go:"Go", fdraft:"Draft list and tips. The team go check am.", wheresub:"Make your phone find you, or tap place wey you dey see.", seeplace:"Or tap place wey you dey see", skip:"Leave am for now", whereto:"Where you wan go?", youat:"You dey for", change:"Change am", setwhere:"Tap here to talk where you dey", you:"You", startpin:"Start", herecard:"You dey here", pressknow:"Press me make you know", to:"reach", towards:"dey go the side of", showme:"Show me", following:"E dey follow you", far:"Your phone talk say you dey {d} far from this road. Direction start for {name}: waka go there first, or pick where you dey again.", whattodo:"Wetin to do", follow:"Follow me", walkfor:"Waka", tleft:"Turn left", tright:"Turn right", tstraight:"Waka straight", stepn:"Step", finding:"We dey find you...", nearby:"Near", going:"You dey go", gpsnote:"E dey work without data", typename:"Write name, or scroll", locdenied:"Location dey off for this app. On am for your browser settings, or pick where you dey from the list.", loctimeout:"GPS dey take too long. Comot go outside or try again.", popular:"Places wey people dey go well well", browse:"Check am by type", tips:"Safety tips: wetin to do", guideme:"Guide me", guidesub:"Big arrow, voice and vibration for every turn", inm:"For {d}", arrivein:"Where you dey go dey front", arrivedat:"You don reach", walkpath:"Waka go the road first", metres:"metres", then:"then", voiceon:"Voice dey on", voiceoff:"Voice dey off", practice:"Practice waka", stopwalk:"Stop practice", practicing:"Practice waka: the app dey waka the road for you.", holdflat:"Hold your phone flat, make the top face front.", nocompass:"This phone no get compass: follow the turn sign and the photo.", acc:"Your GPS correct reach about {m} m", areyouhere:"Na here you dey?", yeshere:"Yes, na here I dey", orthese:"E no correct? Tap where you dey:", outside:"Your phone talk say you dey {d} from the nearest place for map. If you no dey campus, pick one place for down to try the app.", steplist:"See all the steps and the map", offroute:"You dey {d} from the road. Waka go there first.", novoice:"This phone no get Yoruba voice, so we dey show the direction, we no dey talk am.", done:"E don finish", facestraight:"Waka straight for your front", faceleft:"Turn left first", faceright:"Turn right first", facearound:"Turn back first", facehint:"Based on where your phone dey face now"}
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
  if (!store.get("lang")) { lang = lang || "en"; applyLang(); show("lang"); }
  [places, paths, emerg, lessons, fresh] = await Promise.all(["places", "paths", "emergency", "lessons", "freshers"].map(data));
  graph = Route.buildGraph(places, paths);
  if (!lang) lang = "en";
  // A shared link (…?place=main_gate) opens that place. The address is tidied so a reload does not open it again.
  const qs = new URLSearchParams(location.search), sp = qs.get("place"), at = qs.get("at");
  if (sp || at) history.replaceState(null, "", location.pathname);
  shared = sp && graph.byId[sp] && listed().includes(graph.byId[sp]) ? sp : null;
  // A "You are here" QR sticker at a building entrance opens …?at=<place>: the app knows exactly where you stand,
  // with no GPS needed, and only asks where you want to go.
  if (at && graph.byId[at] && shown().includes(graph.byId[at])) { fromId = at; fromGps = false; }
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
    if (top !== id) {
      if (replace && hist.length) hist[hist.length - 1] = id;
      else { if (hist.length) history.pushState({n: hist.length + 1}, ""); hist.push(id); }
    }
  }
  if (id !== "nav") stopWatch();
  if (id !== "guide") stopGuide();
  // Coming back to the directions (from Guide me): the compass and, if you started by GPS, the "You" dot start again.
  if (id === "nav" && back && route) { addEventListener("deviceorientationabsolute", onTurn); addEventListener("deviceorientation", onTurn); if (fromGps) startWatch(); }
  if (id !== "where") gpsRun++;   // leaving the page stops a GPS search that is still running
  const scr = pg ? "pager" : id;
  document.querySelectorAll(".screen").forEach(s => { s.hidden = s.id !== scr; });
  document.body.dataset.screen = scr;
  $("back").hidden = id === "lang" || hist.length < 2;   // Back is shown everywhere you can go back from, back to the welcome page
  document.querySelectorAll(".lrow button").forEach(b => b.setAttribute("aria-pressed", !!store.get("lang") && b.dataset.lang === lang));
  if (pg) { goPage(id, false); if (id === "find") ptiles(); } else document.querySelector("main").scrollTop = 0;
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
  $("guidebtn").innerHTML = I("navigation") + "<span><b>" + t("guideme") + "</b><small>" + t("guidesub") + "</small></span>";
  if (!$("guide").hidden && route) { gButtons(); gRender(); }
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
  recents(true); freshCard(!!on);
  $("home").hidden = !!on; if (!on) ptiles(); $("list").hidden = !on; $("catpill").hidden = !cat;
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
// Popular places as big photo tiles: the places you chose before first, then the places most people look for.
// A newcomer recognises a building from its photo before they know its name.
const POPULAR = ["faculty_of_computing_science_and_engineering", "faculty_of_technology", "faculty_of_technology_lecture_theatre", "1000lt", "hezekiah_oluwasanmi_library", "student_union_building", "health_centre", "main_gate"];
function ptiles() {
  if (!graph) return;
  const ok = new Set(listed().map(p => p.id)), ids = [...new Set(recent().concat(POPULAR))].filter(id => ok.has(id)).slice(0, 6);
  $("ptiles").innerHTML = ids.map(id => { const p = graph.byId[id];
    return '<button data-id="' + id + '">' + (p.photo ? '<img src="' + p.photo + '" alt="" loading="lazy" decoding="async" width="320" height="180">' : icon("mk", M(p.category))) + "<b>" + p.name + "</b></button>"; }).join("");
  $("ptiles").querySelectorAll("button").forEach(b => { b.onclick = () => pick(b.dataset.id); });
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
function whereScreen(forDest) { pendingDest = forDest; $("wq").value = ""; $("gpsmsg").textContent = ""; wlist(); show("where"); if (forDest && navigator.geolocation) gpsFind(); }
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
    (fromId ? (fromGps ? t("nearby") + " " : "") + nameOf(fromId) : t("pressknow")) + "</b></span>" + (fromId ? "<em>" + t("change") + "</em>" : "");
}
// Finding you: the first GPS reading is often 50-100 m off, so the phone listens for up to 10 seconds and keeps the
// most accurate reading (it stops early once it is within 20 m). Then it ASKS: "Are you here?" with the photo of
// the nearest place, and the next three nearest in case it is wrong. Nothing is guessed silently.
let gpsRun = 0;
function gpsFind() {
  if (!navigator.geolocation) { $("gpsmsg").textContent = t("nolocation"); return; }
  askCompass();
  const run = ++gpsRun; let best = null, w = null, tm = 0;
  const msg = () => { $("gpsmsg").textContent = t("finding") + (best ? " " + t("acc").replace("{m}", Math.round(best.coords.accuracy)) : ""); };
  const end = () => { navigator.geolocation.clearWatch(w); clearTimeout(tm); if (run === gpsRun && best) confirmHere(best); };
  msg();
  w = navigator.geolocation.watchPosition(pos => {
    if (run !== gpsRun) return navigator.geolocation.clearWatch(w);
    if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
    msg(); if (best.coords.accuracy <= 20) end();
  }, e => { navigator.geolocation.clearWatch(w); clearTimeout(tm); if (run !== gpsRun) return; if (best) confirmHere(best); else $("gpsmsg").textContent = locErr(e); },
  {enableHighAccuracy: true, timeout: 20000, maximumAge: 0});
  tm = setTimeout(() => { if (best) end(); }, 10000);
}
function confirmHere(pos) {
  const m = {lat: pos.coords.latitude, lng: pos.coords.longitude};
  const near = shown().filter(p => !pendingDest || p.id !== placeId).map(p => ({p, d: Route.haversine(m, p)})).sort((a, b) => a.d - b.d).slice(0, 4);
  if (!near.length) { $("gpsmsg").textContent = t("nolocation"); return; }
  const top = near[0], dist = x => away(x.d).split(" \u00b7 ")[0];
  const opt = (x, big) => '<button class="' + (big ? "here1" : "here2") + '" data-id="' + x.p.id + '">' + (x.p.photo ? '<img src="' + x.p.photo + '" alt="" width="320" height="180">' : "") +
    "<span><b>" + x.p.name + "</b><small>" + dist(x) + "</small></span></button>";
  $("gpsmsg").innerHTML = (top.d > 400 ? '<p class="warnbox">' + t("outside").replace("{d}", dist(top)) + "</p>" : "") +
    '<h3 class="areq">' + t("areyouhere") + '</h3><small class="accm">' + t("acc").replace("{m}", Math.round(pos.coords.accuracy)) + "</small>" + opt(top, true) +
    '<button id="hereyes" class="primary">' + I("circle-check") + t("yeshere") + '</button><p class="orth">' + t("orthese") + "</p>" + near.slice(1).map(x => opt(x)).join("");
  $("hereyes").onclick = () => setFrom(top.p.id, true);
  $("gpsmsg").querySelectorAll("button[data-id]").forEach(b => { b.onclick = () => setFrom(b.dataset.id, true); });
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
  $("guidebtn").hidden = !route;
  // The compass starts with the directions (it needs no GPS and no data), so the first card can say which way to turn.
  askCompass(); addEventListener("deviceorientationabsolute", onTurn); addEventListener("deviceorientation", onTurn);
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
  // Each card says how far to walk and WHICH PLACE you walk to next: the landmark at the next turn (or a known place
  // within 120 m of it), and the destination only on the last stretch. "Walk 260 m to Faculty of Science".
  const nextMark = i => {
    if (i + 1 >= n) return end.name;
    const nx = steps[i + 1];
    if (nx.near) return nameOf(nx.near);
    const at = graph.byId[route.ids[nx.from]]; let best = null, bd = 120;
    listed().forEach(p => { if (p.id === start.id || p.id === end.id) return; const d = Route.haversine(at, p); if (d < bd) { bd = d; best = p; } });
    return best ? best.name : null;
  };
  const leg = i => { const a = steps[i].from, b = i + 1 < n ? steps[i + 1].from : route.ids.length - 1; let m = 0;
    for (let k = a; k < b; k++) m += Route.haversine(graph.byId[route.ids[k]], graph.byId[route.ids[k + 1]]);
    const mark = nextMark(i);
    if (mark) return '<small class="leg">' + t("walkfor") + " " + away(m) + " " + t("to") + '</small><b class="nextp">' + mark + "</b>";
    // No landmark at the next turn: name the next landmark further along, so there is always a place to aim for.
    let ahead = end.name;
    for (let j = i + 2; j < n; j++) if (steps[j].near) { ahead = nameOf(steps[j].near); break; }
    return '<small class="leg">' + t("walkfor") + " " + away(m) + " " + t("towards") + '</small><b class="nextp">' + ahead + "</b>"; };
  const what = s => "<b>" + t("t" + s.turn) + "</b>";
  const one = (ico, label, p, text, tag) => '<article class="scard"><div class="shead"><span class="sico">' + I(ico) + '</span><small class="' + (tag ? "tag " + tag : "") + '">' + label + "</small></div>" + (p ? '<div class="pic">' + pic(p) + "</div>" : '<div class="bigturn">' + I(ico) + "</div>") + '<div class="stext">' + text + "</div></article>";
  $("scards").innerHTML = steps.map((s, i) => i === 0
    ? one("footprints", t("herecard"), start, "<b>" + start.name + "</b>" + leg(0) + '<p id="facing" class="facing" hidden></p>', "here")
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
  facingHint();
}
// The turns at junctions are the same for everyone walking the route (left is left once you walk the right way),
// but the FIRST move depends on which way you face. The compass compares the phone's direction with the first 20 m
// of the route, so two people at the same spot facing opposite ways see "Walk straight ahead" and "Turn around first".
const FACE = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2l7 18-7-4-7 4z" fill="currentColor"/></svg>';
function facingHint() {
  const el = $("facing");
  if (!el || !route || route.ids.length < 2 || rot === null) return;
  if (!$("mapnote").hidden) { el.hidden = true; return; }   // the phone is far from the route: the hint would be wrong
  const a = graph.byId[route.ids[0]]; let j = 1;
  while (j < route.ids.length - 1 && Route.haversine(a, graph.byId[route.ids[j]]) < 20) j++;
  const d = ((Route.bearing(a, graph.byId[route.ids[j]]) - ((rot % 360) + 360) % 360 + 540) % 360) - 180;
  const key = Math.abs(d) < 35 ? "facestraight" : Math.abs(d) > 135 ? "facearound" : d > 0 ? "faceright" : "faceleft";
  el.innerHTML = '<i style="transform:rotate(' + d.toFixed(0) + 'deg)">' + FACE + "</i><span><b>" + t(key) + "</b><small>" + t("facehint") + "</small></span>";
  el.hidden = false;
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
// "Guide me": for someone who has never seen OAU. One big arrow points the way to walk (GPS + compass), the next
// turn is written in big words with how far it is, the photo shows what to look for, and the phone speaks and
// buzzes before every turn and on arrival. It moves on by itself as you walk. "Practice walk" walks the route for
// you (for demonstrations, or to see the way before you go).
let gwatch = null, gsim = 0, gfake = false, gk = 0, gf = 0, gi = -2, said = {}, wake = null, ghead = null, gcourse = null, gsimHead = null, garr = 0, gtarget = null, gme = null, gdone = false;
let voice = store.get("voice") !== "off";
const named = id => !graph.byId[id].hidden;
const spokenM = m => (m < 1000 ? Math.max(10, Math.round(m / 10) * 10) + " " + t("metres") : (m / 1000).toFixed(1) + " km");
function openGuide() {
  if (!route) return;
  gk = 0; gf = 0; gi = -2; said = {}; gme = null; gfake = false; gdone = false; ghead = gcourse = null;
  show("guide"); askCompass();
  $("gdest").textContent = graph.byId[placeId].name;
  addEventListener("deviceorientationabsolute", gTurn); addEventListener("deviceorientation", gTurn);
  if (navigator.geolocation) gwatch = navigator.geolocation.watchPosition(
    p => { if (!gfake) gUpdate({lat: p.coords.latitude, lng: p.coords.longitude}, p.coords.accuracy, p.coords.speed > 0.7 ? p.coords.heading : null); },
    e => { if (!gfake) $("gnote").textContent = locErr(e); }, {enableHighAccuracy: true, maximumAge: 2000, timeout: 30000});
  if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { wake = w; }).catch(() => {});   // keep the screen on while walking
  gButtons(); gRender();
}
function stopGuide() {
  if (gwatch !== null) navigator.geolocation.clearWatch(gwatch);
  gwatch = null; clearInterval(gsim); gsim = 0;
  removeEventListener("deviceorientationabsolute", gTurn); removeEventListener("deviceorientation", gTurn);
  if (wake) { wake.release().catch(() => {}); wake = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
}
// The phone speaks in English or Pidgin with its own built-in voice (no data needed on most phones). Yoruba is only
// spoken if the phone has a Yoruba voice; otherwise the words stay on the screen.
function say(text) {
  if (!voice || !window.speechSynthesis || !text) return;
  const vs = speechSynthesis.getVoices(), yo = vs.find(v => /^yo/i.test(v.lang));
  if (lang === "yo" && !yo) { $("gnote").textContent = t("novoice"); return; }
  const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
  u.voice = lang === "yo" ? yo : vs.find(v => /^en[-_]NG/i.test(v.lang)) || vs.find(v => /^en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  u.lang = lang === "yo" ? "yo-NG" : "en-NG"; u.rate = 0.95;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
const buzz = p => { if (navigator.vibrate) navigator.vibrate(p); };
// Where are you along the route? The nearest point on any stretch of it (route points can be 100 m apart on a
// straight road, so the distance is measured to the line between them), never jumping back more than a few points.
// gk is the stretch you are on and gf how far along it (0 to 1).
const xy = (p, o) => [(p.lng - o.lng) * 111320 * Math.cos(o.lat * Math.PI / 180), (p.lat - o.lat) * 110540];   // metres east and north of o
function gUpdate(me, acc, course) {
  gme = me; if (course != null) gcourse = course;
  const ids = route.ids; let k = gk, f = 0, bd = Infinity;
  for (let i = Math.max(0, gk - 3); i < ids.length - 1; i++) {
    const a = xy(graph.byId[ids[i]], me), b = xy(graph.byId[ids[i + 1]], me), dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const u = l2 ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / l2)) : 0, d = Math.hypot(a[0] + u * dx, a[1] + u * dy);
    if (d < bd) { bd = d; k = i; f = u; }
  }
  gk = k; gf = f; gRender(bd, acc);
}
const seg = j => Route.haversine(graph.byId[route.ids[j]], graph.byId[route.ids[j + 1]]);
// The next turn after route point k, and how far away it is along the route.
function gNext(k) {
  const i = steps.findIndex(s => s.from > k), to = i < 0 ? route.ids.length - 1 : steps[i].from;
  let m = 0; for (let j = k; j < to; j++) m += seg(j) * (j === k ? 1 - gf : 1);
  return {i, m};
}
// A point about 20 m further along the route: the arrow points at it, so it always shows the way to walk next.
function gAhead(k) {
  let left = 20 + (k < route.ids.length - 1 ? seg(k) * gf : 0);
  for (let j = k; j < route.ids.length - 1; j++) { const d = seg(j); if (d >= left) return graph.byId[route.ids[j + 1]]; left -= d; }
  return graph.byId[route.ids[route.ids.length - 1]];
}
function gRender(off, acc) {
  const end = graph.byId[placeId], me = gme || graph.byId[route.ids[0]], {i, m} = gNext(gk);
  let left = 0; for (let j = gk; j < route.ids.length - 1; j++) left += seg(j) * (j === gk ? 1 - gf : 1);
  $("gleft").textContent = away(left);
  const s = i >= 0 ? steps[i] : null, lmk = s ? (s.near || (named(route.ids[s.from]) ? route.ids[s.from] : null)) : null;
  const turnTxt = s ? t("t" + s.turn) : "", where = lmk ? t("at") + " " + nameOf(lmk) : "";
  const arrived = gme && i < 0 && (m <= 20 || (gdone && m <= 60));   // once arrived, small GPS wobbles do not undo it
  // Far from the route: the arrow points to the nearest point of the route instead.
  const offr = gme && off > 35 && !arrived;
  const A = graph.byId[route.ids[gk]], B = graph.byId[route.ids[Math.min(gk + 1, route.ids.length - 1)]];
  gtarget = offr ? {lat: A.lat + (B.lat - A.lat) * gf, lng: A.lng + (B.lng - A.lng) * gf} : gAhead(gk);
  $("gnote").textContent = gsim ? t("practicing") : !gme ? t("finding") : acc ? t("acc").replace("{m}", Math.round(acc)) : "";
  if (arrived) {
    $("gtext").innerHTML = "<small>" + t("arrivedat") + "</small><b>" + end.name + "</b>";
    $("gdial").className = "arrived"; $("garrow").innerHTML = I("flag");
    $("gleft").textContent = ""; $("gnote").textContent = "";
  } else {
    $("gtext").innerHTML = offr ? "<small>" + t("offroute").replace("{d}", away(off).split(" \u00b7 ")[0]) + "</small><b>" + t("walkpath") + "</b>"
      : '<small>' + t("inm").replace("{d}", away(m).split(" \u00b7 ")[0]) + "</small><b>" + (s ? turnTxt : t("arrivein")) + "</b>" + (where ? "<span>" + where + "</span>" : "");
    $("gdial").className = ""; $("garrow").innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 6 86 84 50 66 14 84z" fill="currentColor" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>';
    gArrow(s);
  }
  // The photo of what to look for: the landmark at the next turn, or the place itself on the last stretch.
  const pp = arrived || !s ? end : lmk ? graph.byId[lmk] : null;
  $("gpic").innerHTML = pp ? '<div class="pic">' + pic(pp) + "</div><small>" + (arrived ? end.name : t("lookfor")) + "</small>" : "";
  // Speaking and buzzing: once when a new stretch starts, once just before the turn, and on arrival.
  if (!gme && gi !== -2) return;
  if (arrived) { if (!gdone) { gdone = true; say(t("arrivedat") + " " + end.name); buzz([400, 150, 400, 150, 400]); clearInterval(gsim); gsim = 0; gButtons(); } return; }
  if (offr) return;
  const plan = (s ? t("walkfor") + " " + spokenM(m) + ", " + t("then") + " " + turnTxt.toLowerCase() + (where ? " " + where : "") : t("walkfor") + " " + spokenM(m) + ". " + t("arrivein"));
  if (i !== gi) { gi = i; say(plan); if (gme) buzz(200); return; }
  if (s && m <= 30 && !said["now" + i]) { said["now" + i] = 1; said["soon" + i] = 1; say(turnTxt + (where ? " " + where : "")); buzz([300, 120, 300]); }
  else if (s && m <= 120 && m > 60 && !said["soon" + i]) { said["soon" + i] = 1; say(t("inm").replace("{d}", spokenM(m)) + ", " + turnTxt.toLowerCase() + (where ? " " + where : "")); }
}
// The arrow: the direction to walk, minus the way the phone is facing. Without a compass (or before the phone has
// moved), it shows the turn sign instead, so it never points the wrong way.
function gArrow(s) {
  if (!gtarget || $("guide").hidden || $("gdial").className === "arrived") return;
  const me = gme || graph.byId[route.ids[0]], head = gsim ? gsimHead : ghead != null ? ghead : gcourse;
  if (head == null) {
    $("gdial").className = "noc"; $("garrow").innerHTML = I(s && s.turn === "left" ? "corner-up-left" : s && s.turn === "right" ? "corner-up-right" : "arrow-up");
    if (!gsim) $("gnote").textContent = t(gme ? "nocompass" : "holdflat");
    return;
  }
  if ($("gdial").className === "noc") { $("gdial").className = ""; $("garrow").innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 6 86 84 50 66 14 84z" fill="currentColor" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>'; }
  const want = Route.bearing(me, gtarget) - head;
  garr = garr + ((want - garr % 360 + 540) % 360) - 180;   // always turn the short way round
  $("garrow").style.transform = "rotate(" + garr.toFixed(1) + "deg)";
  // Facing the wrong way: say so in words too (and once out loud), until the arrow points ahead.
  const d = ((want % 360) + 540) % 360 - 180, key = Math.abs(d) > 135 ? "facearound" : Math.abs(d) > 50 ? (d > 0 ? "faceright" : "faceleft") : "";
  $("gface").hidden = !key || !!gsim; $("gface").textContent = key ? t(key) : "";
  if (key === "facearound" && !gsim && !said.face) { said.face = 1; say(t("facearound")); buzz(150); }
}
let gtRaf = 0;
function gTurn(e) {
  const h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null);
  if (h == null) return;
  const sa = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  ghead = (h + sa) % 360;
  const now = Date.now();   // at most 20 updates a second: smooth, and light on the battery
  if (now - gtRaf >= 50) { gtRaf = now; const n = gNext(gk); gArrow(n.i >= 0 ? steps[n.i] : null); }
}
// Practice walk: a pretend walker moves along the route at about 10 m a second, so the whole guide (arrow, words,
// voice, buzz) can be shown indoors or before a real walk.
function gSim() {
  if (gsim) { clearInterval(gsim); gsim = 0; gfake = false; gButtons(); gRender(); return; }   // stopped by hand: back to the real GPS
  const ids = route.ids; let j = gk, f = 0;
  if (gdone) { j = 0; gk = 0; gf = 0; gi = -2; said = {}; gdone = false; }
  gfake = true;   // the pretend walker replaces the GPS until it is stopped (after arriving it stays on the arrival screen)
  gsim = setInterval(() => {
    let go = 4;
    while (go > 0 && j < ids.length - 1) { const L = Route.haversine(graph.byId[ids[j]], graph.byId[ids[j + 1]]) || 0.01, rest = L * (1 - f);
      if (go < rest) { f += go / L; go = 0; } else { go -= rest; j++; f = 0; } }
    const A = graph.byId[ids[j]], B = graph.byId[ids[Math.min(j + 1, ids.length - 1)]];
    if (A !== B) gsimHead = Route.bearing(A, B);
    gUpdate({lat: A.lat + (B.lat - A.lat) * f, lng: A.lng + (B.lng - A.lng) * f}, null, gsimHead);
    if (j >= ids.length - 1) { clearInterval(gsim); gsim = 0; gButtons(); }
  }, 400);
  gButtons(); gRender();
}
function gButtons() {
  $("gvoice").innerHTML = I("volume-2") + t(voice ? "voiceon" : "voiceoff"); $("gvoice").setAttribute("aria-pressed", voice);
  $("gsim").innerHTML = I("footprints") + t(gsim ? "stopwalk" : "practice"); $("gsim").setAttribute("aria-pressed", !!gsim);
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
  const c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) { $("status").innerHTML = icon("ic", I("circle-check")) + t("ready"); return; }
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
  if (shared) { pick(shared); shared = null; } else show("find");
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
$("guidebtn").onclick = openGuide;
$("gvoice").onclick = () => { voice = !voice; store.set("voice", voice ? "on" : "off"); if (!voice && window.speechSynthesis) speechSynthesis.cancel(); gButtons(); };
$("gsim").onclick = gSim;
$("gmap").onclick = () => history.back();
if (window.speechSynthesis) speechSynthesis.getVoices();   // some phones load their voices only when first asked
$("wskip").onclick = () => show("find");
// Not known yet: pressing the card asks the phone (GPS) and fills it in. Known: pressing it lets you change it.
$("fromcard").onclick = () => {
  if (!graph) return;   // places still loading
  whereScreen(false);
  if (navigator.geolocation) gpsFind();
};
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
