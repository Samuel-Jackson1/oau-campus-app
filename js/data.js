// data.js - loads the JSON data files and gives the screens simple functions to use.
//
// HOW THE FRONT END USES THIS FILE:
//
//   import * as data from './js/data.js';
//
//   await data.loadData();                        // call once when the app starts
//   data.searchPlaces('lt2');                     // -> [{ place, score, matchedOn }]
//   data.searchPlaces('hall', { category: 'hostel' });
//   data.getCategories();                         // -> list for the category buttons
//   data.getPlacesInCategory('lecture-theatre');  // -> lecture-theatre list (A to Z)
//   data.getPlace('main-gate');                   // -> one place, or null
//   data.getContacts();                           // -> emergency contacts
//   data.isSampleData();                          // -> true while sample entries remain
//
// The field-by-field format is explained in DATA_FORMAT.md.

import { searchPlaces as runSearch } from './search.js';

const FILES = ['places.json', 'categories.json', 'contacts.json'];

let store = null;    // the loaded data, filled by loadData()
let loading = null;  // so two calls at once only download once

// Downloads all data files. Safe to call many times; it only downloads once.
export function loadData(baseUrl = './data/') {
  if (store) return Promise.resolve(store);
  if (!loading) {
    loading = Promise.all(FILES.map((file) => fetchJson(baseUrl + file)))
      .then(([places, categories, contacts]) => {
        store = {
          places: places.places ?? [],
          zones: places.zones ?? [],
          updated: places.updated ?? '',
          categories: categories.categories ?? [],
          contacts: contacts.contacts ?? []
        };
        return store;
      })
      .finally(() => { loading = null; });  // if it failed, the next call can try again
  }
  return loading;
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Could not download ${url}. Check the internet connection or the server. (${err.message})`);
  }
  if (!response.ok) throw new Error(`Could not load ${url} (error ${response.status}).`);
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`${url} is not valid JSON - check for a missing comma or quote. (${err.message})`);
  }
}

function requireStore() {
  if (!store) throw new Error('Data not loaded yet. Call "await loadData()" first.');
  return store;
}

export function getPlaces() {
  return requireStore().places;
}

export function getPlace(id) {
  return requireStore().places.find((p) => p.id === id) ?? null;
}

export function getCategories() {
  return requireStore().categories;
}

export function getCategory(id) {
  return requireStore().categories.find((c) => c.id === id) ?? null;
}

export function getPlacesInCategory(categoryId) {
  return requireStore().places
    .filter((p) => p.category === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getZones() {
  return requireStore().zones;
}

export function getContacts() {
  return requireStore().contacts;
}

export function searchPlaces(text, options = {}) {
  const { places, categories } = requireStore();
  return runSearch(places, text, { categories, ...options });
}

// True while any made-up sample entry is still in places.json.
export function isSampleData() {
  return requireStore().places.some((p) => p.sample);
}
