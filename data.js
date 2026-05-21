// Packhelfer – master data

const CATEGORIES_ORDER = ['Kleidung', 'Uniform', 'Schuhe', 'Travel Essentials', 'Gear', 'Elektro', 'Dokumente', 'Medizin', 'Sport'];

const CONTEXTS = {
  reise:   { label: 'Reise',   emoji: '🧳', desc: 'Wochenend bis Fernreise' },
  layover: { label: 'Layover', emoji: '✈️', desc: 'Beruflich, 1–2 Tage' },
  hamburg: { label: 'Hamburg', emoji: '🏠', desc: 'Klamotten & Hygiene vor Ort' },
  camper:  { label: 'Conni',   emoji: '🚐', desc: 'Mit der Conni' }
};

const DRESSCODES = [
  { id: 'business_casual', label: 'Business Casual', emoji: '👔' },
  { id: 'formell',         label: 'Formell',          emoji: '🤵' }
];

const SPORTS = [
  { id: 'laufen',    label: 'Laufen',        emoji: '🏃' },
  { id: 'padel',     label: 'Padel',         emoji: '🎾' },
  { id: 'rennrad',   label: 'Rennrad',       emoji: '🚴' },
  { id: 'fussball',  label: 'Fußball',       emoji: '⚽' },
  { id: 'flag',      label: 'Flag Football', emoji: '🏈' },
  { id: 'kraft',     label: 'Krafttraining', emoji: '🏋️' },
  { id: 'schwimmen', label: 'Schwimmen',     emoji: '🏊' },
  { id: 'wandern',   label: 'Wandern',       emoji: '🥾' }
];

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

// contexts:           auf welcher Kontextliste erscheint das Item
// vorOrtContexts:     bei diesen Kontexten ist das Item am Zielort vorhanden
// sportOnly:          erscheint nur wenn sportIds-Sport gewählt wurde
// dresscodeOnly:      erscheint nur wenn dresscodeIds-Dresscode gewählt wurde
// laptopOnly:         erscheint nur wenn Laptop-Option gewählt
// uniformVollstaendig:erscheint nur wenn NICHT uniformiert aus dem Haus
// uniformWechsel:     qty -1 wenn uniformiert (shirt already worn)
// rainOnly:           erscheint nur wenn Regen im Forecast
// minTemp:            erscheint nur wenn max Tagestemperatur >= minTemp
// maxTempThreshold:   erscheint nur wenn max Tagestemperatur < maxTempThreshold
const DEFAULT_ITEMS = [

  // ── KLEIDUNG ─────────────────────────────────────────────────────────────────

  { id: 'unterhosen',   name: 'Unterhosen',      category: 'Kleidung', scaleable: true,  scalePerDay: 1, maxQty: 14, washMaxQty: 7, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'] },

  { id: 'socken',       name: 'Socken',           category: 'Kleidung', scaleable: true,  scalePerDay: 1, maxQty: 14, washMaxQty: 7, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'] },

  { id: 'tshirts',      name: 'T-Shirts',         category: 'Kleidung', scaleable: true,  scalePerDay: 1, maxQty: 5, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: ['hamburg'] },

  { id: 'hemd',         name: 'Hemd / Poloshirt', category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['layover'],                      vorOrtContexts: [] },

  { id: 'zipper',       name: 'Zipper',           category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'] },

  { id: 'regenjacke',   name: 'Regenjacke',       category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [],
    sportOnly: true, sportIds: ['wandern'], rainOnly: true },

  { id: 'arcteryx-wind',  name: "Arc'teryx Windjacke",   category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [],
    minTemp: 11, maxTempThreshold: 22 },

  { id: 'arcteryx-daune', name: "Arc'teryx Daunenjacke", category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper'],     vorOrtContexts: [],
    maxTempThreshold: 11 },

  { id: 'kurze-hose',   name: 'Kurze Hose',       category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'], minTemp: 15 },

  { id: 'sporthose',    name: 'Sporthose kurz',   category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'] },

  { id: 'chino',        name: 'Chino-Hose',       category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','hamburg'],     vorOrtContexts: ['hamburg'] },

  { id: 'wanderhose',   name: 'Wanderhose',       category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [] },

  { id: 'lange-unter',  name: 'Lange Unterhose',  category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [] },

  { id: 'muetze',       name: 'Mütze',            category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: ['hamburg'] },

  { id: 'cap',          name: 'Cap',              category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: ['hamburg'] },

  { id: 'handschuhe',   name: 'Handschuhe',       category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [] },

  { id: 'buff',         name: 'Buff',             category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: [] },

  { id: 'rucksackcape', name: 'Rucksackcape',     category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise'],                        vorOrtContexts: [] },

  // Dresscode-Items
  { id: 'sakko',        name: 'Sakko / Blazer',          category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [],
    dresscodeOnly: true, dresscodeIds: ['business_casual','formell'] },
  { id: 'anzughose',    name: 'Anzughose',               category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [],
    dresscodeOnly: true, dresscodeIds: ['formell'] },
  { id: 'krawatte',     name: 'Krawatte / Einstecktuch', category: 'Kleidung', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [],
    dresscodeOnly: true, dresscodeIds: ['formell'] },

  // ── UNIFORM – Layover ─────────────────────────────────────────────────────────

  { id: 'uniform-hemd-wechsel',   name: 'Uniformhemd (Wechsel)',    category: 'Uniform', scaleable: true, scalePerDay: 1, maxQty: 5, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformWechsel: true },
  { id: 'uniform-socken-wechsel', name: 'Uniformsocken (Wechsel)',  category: 'Uniform', scaleable: true, scalePerDay: 1, maxQty: 5, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformWechsel: true },

  { id: 'uniform-schuhe',    name: 'Uniformschuhe',      category: 'Schuhe',  scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-hose',      name: 'Uniformhose',        category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-hemd',      name: 'Uniformhemd',        category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-guertel',   name: 'Uniformgürtel',      category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-sakko',     name: 'Uniformsakko',       category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-krawatte',  name: 'Krawatte (Uniform)', category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-epauletten',name: 'Epauletten',         category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'service-weste',     name: 'Service-Weste',      category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },
  { id: 'uniform-socken',    name: 'Uniformsocken',      category: 'Uniform', scaleable: false, baseQty: 1,
    contexts: ['layover'], vorOrtContexts: [], uniformVollstaendig: true },

  // ── SCHUHE ───────────────────────────────────────────────────────────────────

  { id: 'wanderschuhe', name: 'Wanderschuhe',     category: 'Schuhe',   scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: ['camper'] },

  { id: 'sneaker',      name: 'Sneaker',          category: 'Schuhe',   scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: ['hamburg'] },

  { id: 'adiletten',    name: 'Adiletten',        category: 'Schuhe',   scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: ['hamburg','camper'] },

  { id: 'lederschuhe',  name: 'Lederschuhe / Derby', category: 'Schuhe', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [],
    dresscodeOnly: true, dresscodeIds: ['formell'] },

  // ── TRAVEL ESSENTIALS ─────────────────────────────────────────────────────────
  // Kulturbeutel + Comfort Kit je als ein Item (kein Einzellisting)
  // Nicht für Hamburg/Camper – dort bereits vorhanden

  { id: 'kulturbeutel', name: 'Kulturbeutel',     category: 'Travel Essentials', scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [] },

  { id: 'comfort-kit',  name: 'Comfort Kit',      category: 'Travel Essentials', scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [] },

  // ── GEAR ─────────────────────────────────────────────────────────────────────

  { id: 'bauchtasche',  name: 'Bauchtasche',      category: 'Gear',     scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'handtuch',     name: 'Handtuch',         category: 'Gear',     scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: ['hamburg','camper'] },

  { id: 'trinkflasche', name: 'Trinkflasche',     category: 'Gear',     scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],               vorOrtContexts: ['camper'] },

  { id: 'goeffel',      name: 'Göffel + LH Messer', category: 'Gear',  scaleable: false, baseQty: 1,
    contexts: ['reise'],                        vorOrtContexts: [] },

  { id: 'sonnenbrille', name: 'Sonnenbrille',     category: 'Gear',     scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  // ── ELEKTRO ──────────────────────────────────────────────────────────────────

  { id: 'laptop',       name: 'Laptop',           category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [], laptopOnly: true },

  { id: 'iphone',       name: 'iPhone',           category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'cmd',          name: 'CMD (Cabin Mobile Device)', category: 'Elektro', scaleable: false, baseQty: 1,
    contexts: ['layover'],                      vorOrtContexts: [] },

  { id: 'kindle',       name: 'Kindle',           category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [] },

  { id: 'airpods',      name: 'AirPods',          category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'ladekabel',    name: 'Ladekabel',        category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'socket',       name: 'Reiseadapter',     category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [] },

  { id: 'powerbank',    name: 'Powerbank',        category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'maus',         name: 'Maus',             category: 'Elektro',  scaleable: false, baseQty: 1,
    contexts: ['reise','layover'],              vorOrtContexts: [], laptopOnly: true },

  // ── DOKUMENTE ────────────────────────────────────────────────────────────────

  { id: 'reisepass',    name: 'Reisepass',        category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['layover'],                      vorOrtContexts: [] },

  { id: 'perso',        name: 'Perso',            category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],      vorOrtContexts: [] },

  { id: 'kreditkarte',  name: 'Kreditkarte(n)',   category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['reise','layover','camper','hamburg'], vorOrtContexts: [] },

  { id: 'journal',      name: 'Journal',          category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['reise'],                        vorOrtContexts: [] },

  { id: 'lh-ausweis',   name: 'LH-Ausweis',       category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['layover'],                      vorOrtContexts: [] },

  { id: 'fb-lizenz',    name: 'FB-Lizenzen',      category: 'Dokumente', scaleable: false, baseQty: 1,
    contexts: ['layover'],                      vorOrtContexts: [] },

  // ── SPORT – nur wenn entsprechender Sport gewählt ────────────────────────────

  { id: 'padel-schlaeger',   name: 'Padel-Schläger',    category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['padel'] },
  { id: 'padel-schuhe',      name: 'Padel-Schuhe',      category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['padel'] },
  { id: 'laufschuhe',        name: 'Laufschuhe',        category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper','hamburg'],vorOrtContexts: [], sportOnly: true, sportIds: ['laufen'] },
  { id: 'radschuhe',         name: 'Radschuhe',         category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'radhelm',           name: 'Fahrradhelm',       category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'radtrikot',         name: 'Radtrikot/-hose',   category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'fussball-schuhe',   name: 'Fußballschuhe',     category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['fussball'] },
  { id: 'schienbeinschoner', name: 'Schienbeinschoner', category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['fussball'] },
  { id: 'flag-cleats',       name: 'Cleats',            category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['flag'] },
  { id: 'flag-guertel',      name: 'Flaggengürtel',     category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['flag'] },
  { id: 'badehose',          name: 'Badehose',          category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: ['hamburg'], sportOnly: true, sportIds: ['schwimmen'] },
  { id: 'wanderstöcke',      name: 'Wanderstöcke',      category: 'Sport', scaleable: false, baseQty: 1,
    contexts: ['reise','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['wandern'] },
];
