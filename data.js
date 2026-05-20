// Packhelfer – master data

const CATEGORIES_ORDER = ['Kleidung', 'Schuhe', 'Gear', 'Elektro', 'Dokumente', 'Sport'];

const CONTEXTS = {
  urlaub:    { label: 'Urlaub',        emoji: '🏖️', desc: 'Fernreise, mehrtägig' },
  wochenend: { label: 'Wochenendtrip', emoji: '🌃', desc: '2–4 Tage, Freizeit' },
  layover:   { label: 'Layover',       emoji: '✈️', desc: 'Beruflich, 1–2 Tage' },
  hamburg:   { label: 'Hamburg',       emoji: '🏠', desc: 'Klamotten vor Ort' },
  camper:    { label: 'Camper',        emoji: '🚐', desc: 'Mit dem Camper' }
};

const SPORTS = [
  { id: 'laufen',    label: 'Laufen',       emoji: '🏃' },
  { id: 'padel',     label: 'Padel',        emoji: '🎾' },
  { id: 'rennrad',   label: 'Rennrad',      emoji: '🚴' },
  { id: 'fussball',  label: 'Fußball',      emoji: '⚽' },
  { id: 'flag',      label: 'Flag Football',emoji: '🏈' },
  { id: 'kraft',     label: 'Krafttraining',emoji: '🏋️' },
  { id: 'schwimmen', label: 'Schwimmen',    emoji: '🏊' }
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

// contexts: Reisekontexte, bei denen dieser Gegenstand auf der Liste erscheint
// vorOrtContexts: Kontexte, bei denen das Item automatisch als "Vor Ort" markiert wird
// sportOnly: erscheint nur, wenn entsprechender Sport gewählt
// sportIds: Sport-IDs, die dieses Item triggern (leer = immer anzeigen)
const DEFAULT_ITEMS = [
  // KLEIDUNG
  { id: 'unterhosen',    name: 'Unterhosen',       category: 'Kleidung',  scaleable: true,  scalePerDay: 1, maxQty: 7,  baseQty: 1, contexts: ['urlaub','wochenend','layover','camper'],          vorOrtContexts: ['hamburg'] },
  { id: 'socken',        name: 'Socken',            category: 'Kleidung',  scaleable: true,  scalePerDay: 1, maxQty: 6,  baseQty: 1, contexts: ['urlaub','wochenend','layover','camper'],          vorOrtContexts: ['hamburg'] },
  { id: 'tshirts',       name: 'T-Shirts',          category: 'Kleidung',  scaleable: true,  scalePerDay: 1, maxQty: 5,  baseQty: 1, contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'] },
  { id: 'hemd',          name: 'Hemd / Poloshirt',  category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['layover'],                                        vorOrtContexts: ['hamburg'] },
  { id: 'zipper',        name: 'Zipper',            category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper'],          vorOrtContexts: ['hamburg'] },
  { id: 'regenjacke',    name: 'Regenjacke',        category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: [] },
  { id: 'arcteryx',      name: "Arc'teryx",         category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: [] },
  { id: 'kurze-hose',    name: 'Kurze Hose',        category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'] },
  { id: 'sporthose',     name: 'Sporthose kurz',    category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'], sportIds: [] },
  { id: 'chino',         name: 'Chino-Hose',        category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover'],                   vorOrtContexts: ['hamburg'] },
  { id: 'wanderhose',    name: 'Wanderhose',        category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: [] },
  { id: 'lange-unter',   name: 'Lange Unterhose',   category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: [] },
  { id: 'muetze',        name: 'Mütze',             category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'] },
  { id: 'cap',           name: 'Cap',               category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'] },
  { id: 'handschuhe',    name: 'Handschuhe',        category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: ['hamburg'] },
  { id: 'buff',          name: 'Buff',              category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: [] },
  { id: 'rucksackcape',  name: 'Rucksackcape',      category: 'Kleidung',  scaleable: false, baseQty: 1,                             contexts: ['urlaub'],                                         vorOrtContexts: [] },

  // SCHUHE
  { id: 'wanderschuhe',  name: 'Wanderschuhe',      category: 'Schuhe',    scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: [] },
  { id: 'sneaker',       name: 'Sneaker',           category: 'Schuhe',    scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper'],          vorOrtContexts: ['hamburg'] },
  { id: 'adiletten',     name: 'Adiletten',         category: 'Schuhe',    scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: ['hamburg'] },

  // GEAR
  { id: 'bauchtasche',   name: 'Bauchtasche',       category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'kulturbeutel',  name: 'Kulturbeutel',      category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'zahnseide',     name: 'Zahnseide',         category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'handtuch',      name: 'Handtuch',          category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: ['hamburg'] },
  { id: 'ohrstoepsel',   name: 'Ohrstöpsel',        category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'aciclovir',     name: 'Aciclovir',         category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'schlafmaske',   name: 'Schlafmaske',       category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper'],          vorOrtContexts: [] },
  { id: 'trinkflasche',  name: 'Trinkflasche',      category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper'],                    vorOrtContexts: [] },
  { id: 'goeffel',       name: 'Göffel + LH Messer',category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','camper'],                                vorOrtContexts: [] },
  { id: 'sonnenbrille',  name: 'Sonnenbrille',      category: 'Gear',      scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },

  // ELEKTRO
  { id: 'laptop',        name: 'Laptop',            category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','layover'],                               vorOrtContexts: [] },
  { id: 'iphone',        name: 'iPhone',            category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'kindle',        name: 'Kindle',            category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','layover'],                               vorOrtContexts: [] },
  { id: 'airpods',       name: 'AirPods',           category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'ladekabel',     name: 'Ladekabel',         category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'socket',        name: 'Reiseadapter',      category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','layover'],                               vorOrtContexts: [] },
  { id: 'powerbank',     name: 'Powerbank',         category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'maus',          name: 'Maus',              category: 'Elektro',   scaleable: false, baseQty: 1,                             contexts: ['urlaub','layover'],                               vorOrtContexts: [] },

  // DOKUMENTE
  { id: 'reisepass',     name: 'Reisepass',         category: 'Dokumente', scaleable: false, baseQty: 1,                             contexts: ['urlaub','layover'],                               vorOrtContexts: [] },
  { id: 'perso',         name: 'Perso',             category: 'Dokumente', scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','camper','hamburg'],          vorOrtContexts: [] },
  { id: 'kreditkarte',   name: 'Kreditkarte(n)',    category: 'Dokumente', scaleable: false, baseQty: 1,                             contexts: ['urlaub','wochenend','layover','camper','hamburg'],vorOrtContexts: [] },
  { id: 'journal',       name: 'Journal',           category: 'Dokumente', scaleable: false, baseQty: 1,                             contexts: ['urlaub'],                                         vorOrtContexts: [] },

  // SPORT – nur wenn entsprechender Sport gewählt
  { id: 'padel-schlaeger',   name: 'Padel-Schläger',    category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['padel'] },
  { id: 'padel-schuhe',      name: 'Padel-Schuhe',      category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend','camper'],         vorOrtContexts: [], sportOnly: true, sportIds: ['padel'] },
  { id: 'laufschuhe',        name: 'Laufschuhe',        category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend','camper','hamburg'],vorOrtContexts: [], sportOnly: true, sportIds: ['laufen'] },
  { id: 'radschuhe',         name: 'Radschuhe',         category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','camper'],                     vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'radhelm',           name: 'Fahrradhelm',       category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','camper'],                     vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'radtrikot',         name: 'Radtrikot/-hose',   category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','camper'],                     vorOrtContexts: [], sportOnly: true, sportIds: ['rennrad'] },
  { id: 'fussball-schuhe',   name: 'Fußballschuhe',     category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['fussball'] },
  { id: 'schienbeinschoner', name: 'Schienbeinschoner', category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['fussball'] },
  { id: 'flag-cleats',       name: 'Cleats',            category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['flag'] },
  { id: 'flag-guertel',      name: 'Flaggengürtel',     category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','wochenend'],                  vorOrtContexts: [], sportOnly: true, sportIds: ['flag'] },
  { id: 'badehose',          name: 'Badehose',          category: 'Sport', scaleable: false, baseQty: 1, contexts: ['urlaub','camper','wochenend'],         vorOrtContexts: ['hamburg'],        sportOnly: true, sportIds: ['schwimmen'] },
];
