// =====================================================================
// Country — un pays de la planète
// ---------------------------------------------------------------------
// Deux sortes d'attributs :
//
//  1. Les attributs IMMÉDIATS, connus dès le chargement (data/countries.json) :
//     code, nom, capitale, langues, monnaies, superficie, couleurs du
//     drapeau, population… Ce sont des propriétés ou des getters.
//
//  2. Les attributs À LA DEMANDE, qui viennent d'une API ou d'un fichier :
//     photo de couverture, paysages, sites à voir, météo, climat, guide de voyage, espèces…
//     Ce sont des méthodes async : `await pays.weather()`.
//     Chacune n'est calculée qu'une fois puis mémorisée (#memo).
//
// Les champs qui commencent par # sont privés : personne en dehors de
// la classe ne peut les lire ni les modifier (encapsulation).
// =====================================================================

import { DATA, LOCAL_COVERS } from "../config.js";
import { commonsFileName, isTravelPhoto } from "../utils/images.js";
import { City } from "./City.js";
import { Place } from "./Place.js";
import { Site } from "./Site.js";

export class Country {
  #planet;
  #services;
  #memory = new Map();

  constructor(raw, { planet, services, cities = [] }) {
    this.#planet = planet;
    this.#services = services;

    // --- Identité
    this.code = raw.a2;                 // "CI" : code ISO 3166-1 à 2 lettres
    this.code3 = raw.a3;                // "CIV"
    this.name = raw.fr;                 // "Côte d'Ivoire"
    this.officialName = raw.off;        // "République de Côte d'Ivoire"
    this.englishName = raw.en;          // "Ivory Coast"
    this.englishOfficialName = raw.enOff || raw.en;   // "Republic of Côte d'Ivoire"
    this.region = raw.reg;              // "Afrique"
    this.subregion = raw.sub;           // "Afrique de l'Ouest"
    this.independent = raw.ind;
    this.unMember = raw.un;

    // --- Géographie
    this.capitalNames = raw.cap;
    this.center = new Place({ name: raw.fr, lat: raw.ll[0], lon: raw.ll[1] });
    this.area = raw.area;               // km²
    this.landlocked = raw.land;
    this.borderCodes = raw.bord;        // codes à 3 lettres des voisins
    this.cities = cities.map((row) => City.fromRow(row)).sort((a, b) => b.population - a.population);

    // --- Société
    this.languages = raw.lang;
    this.currencies = raw.cur.map((c) => ({ code: c.c, name: c.n, symbol: c.s }));
    this.demonyms = raw.dem || [];      // ["Ivoirien", "Ivoirienne"]
    this.callingCode = raw.idd;
    this.internetDomain = raw.tld;
    // La semaine du pays (données CLDR) : 1 = lundi … 7 = dimanche
    this.week = raw.wk || { first: 1, weekend: [6, 7] };

    // --- Couleurs du drapeau (extraites par outils/build-data.js) : gardées comme
    //     données, mais l'interface n'utilise plus que les 4 palettes du site
    this.colors = raw.colors;
    this.theme = raw.theme;

    // --- Dernière population connue (Our World in Data) : [année, habitants]
    this.populationRecord = raw.pop || null;
  }

  // =================================================================
  // Attributs calculés (getters) : on les lit comme des propriétés
  // =================================================================
  get flag() {
    return DATA.flag(this.code);
  }

  get capital() {
    return this.cities.find((c) => c.isCapital) || null;
  }

  // Point de référence pour la météo : la capitale, sinon le centre du pays
  get referencePlace() {
    return this.capital || this.center;
  }

  get population() {
    return this.populationRecord?.[1] ?? null;
  }

  get populationYear() {
    return this.populationRecord?.[0] ?? null;
  }

  get density() {
    return this.population && this.area ? this.population / this.area : null;
  }

  get mainCurrency() {
    return this.currencies[0] || null;
  }

  // Les pays voisins, en objets Country (demandés à la planète)
  get neighbors() {
    return this.borderCodes
      .map((code3) => this.#planet.countryByCode3(code3))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  get planet() {
    return this.#planet;
  }

  distanceTo(other) {
    return this.referencePlace.distanceTo(other.referencePlace);
  }

  toString() {
    return `${this.name} (${this.code})`;
  }

  // =================================================================
  // Attributs à la demande (async, mémorisés)
  // =================================================================

  // Lance `loader` une seule fois ; les appels suivants reçoivent le même résultat.
  // Un échec n'est pas mémorisé, pour pouvoir réessayer.
  #memo(key, loader) {
    if (!this.#memory.has(key)) {
      const promise = Promise.resolve().then(loader);
      promise.catch(() => this.#memory.delete(key));
      this.#memory.set(key, promise);
    }
    return this.#memory.get(key);
  }

  // Fichier local data/pays/XX.json : les jours fériés (préparés par outils/build-data.js)
  holidays() {
    return this.#memo("holidays", async () => {
      const response = await fetch(DATA.holidays(this.code));
      if (!response.ok) throw new Error("Jours fériés introuvables.");
      return (await response.json()).holidays;
    });
  }

  profile() {
    return this.#memo("profile", () => this.#services.wikidata.profile(this.code));
  }

  sites() {
    return this.#memo("sites", () => this.#services.wikidata.sites(this.code));
  }

  // La photo de la bannière, dans cet ordre :
  //   1. une photo fournie avec le site (img/pays/, voir LOCAL_COVERS dans config.js) ;
  //   2. la photo d'un lieu emblématique du pays (data/lieux-couverture.json) ;
  //   3. la photo du pays sur Wikidata, si c'en est une vraie (pas une carte ni un drapeau) ;
  //   4. celle du site le plus connu.
  // Renvoie { src, title, local } pour une photo du site, { file, title, site } pour une
  // photo Commons (en pleine résolution : la page choisit la largeur selon l'écran), ou null.
  coverPhoto() {
    return this.#memo("cover", async () => {
      const local = LOCAL_COVERS[this.code];
      if (local) return { src: local.src, title: local.title, local: true };
      const landmark = await this.#services.landmarks?.coverFor(this.code).catch(() => null);
      if (landmark) return { file: landmark.file, title: landmark.title, site: null };
      const profile = await this.profile().catch(() => null);
      const own = profile?.images?.find(isTravelPhoto);
      if (own) return { file: own, title: this.name, site: null };
      const sites = await this.sites().catch(() => []);
      const best = sites.find((s) => s.hasPhoto && isTravelPhoto(s.image));
      return best ? { file: best.image, title: best.name, site: best } : null;
    });
  }

  // Introduction Wikipédia : le titre exact vient de Wikidata (ex. "Géorgie (pays)")
  introduction() {
    return this.#memo("introduction", async () => {
      const profile = await this.profile().catch(() => null);
      return this.#services.wikipedia.intro(profile?.wikipediaTitle || this.name);
    });
  }

  // Plan du guide Wikivoyage, puis chaque rubrique à la demande
  travelGuide() {
    return this.#memo("travelGuide", async () => {
      const profile = await this.profile().catch(() => null);
      return this.#services.wikivoyage.outline(profile?.wikivoyageTitle || this.name);
    });
  }

  async guideSection(key) {
    const guide = await this.travelGuide();
    const section = guide?.sections[key];
    if (!section) return null;
    const blocks = await this.#memo(`guide:${key}`, () => this.#services.wikivoyage.section(guide.title, section.index));
    return { ...section, blocks, url: guide.url };
  }

  weather() {
    const { lat, lon } = this.referencePlace;
    return this.#memo("weather", () => this.#services.meteo.forecast(lat, lon));
  }

  climate(year = new Date().getFullYear() - 1) {
    const { lat, lon } = this.referencePlace;
    return this.#memo(`climate:${year}`, () => this.#services.meteo.yearClimate(lat, lon, year));
  }

  exchangeRates() {
    return this.#memo("rates", () => this.#services.exchange.rates());
  }

  species() {
    return this.#memo("species", () => this.#services.nature.species(this));
  }

  // Les plus beaux lieux du pays, en photos (chapitre « Paysages ») : une liste d'objets Site.
  //   1. les lieux emblématiques (data/lieux-couverture.json), choisis pour leurs paysages ;
  //   2. les sites de Wikidata : patrimoine mondial, parcs nationaux, attractions.
  // La photo de la bannière n'est pas répétée. Wikidata peut être lent : au-delà de 12 s,
  // on se contente des lieux emblématiques plutôt que de faire attendre la galerie.
  landscapes(max = 9) {
    return this.#memo("landscapes", async () => {
      const later = (promise, ms, fallback) => Promise.race([promise, new Promise((ok) => setTimeout(() => ok(fallback), ms))]);
      const [landmarks, sites, cover] = await Promise.all([
        (this.#services.landmarks?.photosFor(this.code) ?? Promise.resolve([])).catch(() => []),
        later(this.sites().catch(() => []), 12000, []),
        this.coverPhoto().catch(() => null),
      ]);
      const candidates = [
        ...landmarks.map((p, i) => new Site({ id: `lieu-${i}`, name: p.title, image: p.file, wikipedia: p.article })),
        ...sites.filter((s) => s.hasPhoto && isTravelPhoto(s.image)),
      ];
      const seen = new Set(cover?.file ? [commonsFileName(cover.file)] : []);
      const photos = [];
      for (const site of candidates) {
        const key = commonsFileName(site.image);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        photos.push(site);
      }
      return photos.slice(0, max);
    });
  }

  // Prochains jours fériés à partir d'aujourd'hui
  async upcomingHolidays(limit = 8, from = new Date()) {
    const holidays = await this.holidays();
    const today = from.toISOString().slice(0, 10);
    return holidays.filter(([date]) => date >= today).slice(0, limit).map(([date, name, type]) => ({ date, name, type }));
  }
}
