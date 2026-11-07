// =====================================================================
// WikidataClient — la base de connaissances structurée de Wikipédia
// ---------------------------------------------------------------------
// Wikidata décrit le monde en triplets "élément → propriété → valeur" :
//   Côte d'Ivoire → numéro d'urgence (P2852) → 110
// On l'interroge en SPARQL. Chaque pays est retrouvé par son code ISO à
// 2 lettres (propriété P297).
//
// Deux requêtes seulement, tournées vers le voyage :
//   1. le profil du voyageur : photo, articles Wikipédia et Wikivoyage,
//      prises, tension, sens de circulation, urgences, fuseaux, point culminant ;
//   2. les sites à voir : patrimoine mondial, parcs nationaux, attractions.
//
// Propriétés utilisées :
//   P18 image · P610 point culminant (P2044 altitude) · P1622 sens de circulation
//   P2853 type de prise · P2884 tension · P2852 numéro d'urgence · P421 fuseau horaire
//   P1435 patrimoine (Q9259 = UNESCO) · P31 nature · P17 pays · P625 coordonnées
//
// Les requêtes déclarent leurs préfixes et lisent les libellés sans le
// service wikibase:label : elles marchent aussi sur QLever, le moteur qui
// remplace progressivement l'ancien (Blazegraph, arrêt prévu mi-2027).
// =====================================================================

import { API, SETTINGS } from "../config.js";
import { Site } from "../models/Site.js";
import { ApiClient, ApiError } from "./ApiClient.js";

const PREFIXES = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;

const iso = (code) => {
  if (!/^[A-Z]{2}$/.test(code)) throw new Error(`Code pays invalide : ${code}`);
  return code;
};

const lastPart = (uri) => (uri || "").split("/").pop();
const https = (url) => url.replace(/^http:/, "https:");

export class WikidataClient extends ApiClient {
  constructor() {
    super(API.wikidata, { timeout: SETTINGS.sparqlTimeout });
  }

  // Envoie une requête SPARQL ; renvoie des lignes simples { variable: "valeur" }
  async sparql(query) {
    const json = await this.get("", { format: "json", query: PREFIXES + query });
    if (!json?.results?.bindings) throw new ApiError("Réponse inattendue de Wikidata.");
    return json.results.bindings.map((row) => {
      const out = {};
      for (const [key, cell] of Object.entries(row)) out[key] = cell.value;
      // Libellé : français, sinon anglais, sinon "mul" (libellé commun à toutes les langues,
      // de plus en plus utilisé sur Wikidata pour les noms de personnes et de lieux)
      out.valueLabel = out.labelFr || out.labelEn || out.labelMul || null;
      return out;
    });
  }

  // Les trois libellés possibles d'une variable
  static labels(variable) {
    return `
  OPTIONAL { ${variable} rdfs:label ?labelFr . FILTER(LANG(?labelFr) = "fr") }
  OPTIONAL { ${variable} rdfs:label ?labelEn . FILTER(LANG(?labelEn) = "en") }
  OPTIONAL { ${variable} rdfs:label ?labelMul . FILTER(LANG(?labelMul) = "mul") }`;
  }

  // -------------------------------------------------------------------
  // 1. Le profil du voyageur
  //    Chaque bloc UNION ajoute ses propres lignes, étiquetées par ?key :
  //    on évite ainsi de multiplier les combinaisons de valeurs.
  // -------------------------------------------------------------------
  static profileQuery(code) {
    return `
SELECT ?item ?key ?value ?labelFr ?labelEn ?labelMul ?extra WHERE {
  ?item wdt:P297 "${iso(code)}" .
  {
    ?value schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> .
    BIND("wikipedia" AS ?key)
  } UNION {
    ?value schema:about ?item ; schema:isPartOf <https://fr.wikivoyage.org/> .
    BIND("wikivoyage" AS ?key)
  }
  UNION { ?item wdt:P18 ?value . BIND("image" AS ?key) }
  UNION { ?item wdt:P610 ?value . BIND("highestPoint" AS ?key) OPTIONAL { ?value wdt:P2044 ?extra . } }
  UNION { ?item wdt:P1622 ?value . BIND("drivingSide" AS ?key) }
  UNION { ?item wdt:P2853 ?value . BIND("plugType" AS ?key) }
  UNION { ?item wdt:P2884 ?value . BIND("voltage" AS ?key) }
  UNION { ?item wdt:P2852 ?value . BIND("emergency" AS ?key) }
  UNION { ?item wdt:P421 ?value . BIND("timeZone" AS ?key) }
  ${WikidataClient.labels("?value")}
}`;
  }

  async profile(code) {
    const rows = await this.sparql(WikidataClient.profileQuery(code));
    if (!rows.length) return null;

    // Plusieurs éléments peuvent porter le même code (rare) : on garde celui qui a le plus d'informations
    const counts = new Map();
    for (const r of rows) counts.set(r.item, (counts.get(r.item) || 0) + 1);
    const item = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const mine = rows.filter((r) => r.item === item);

    const all = (key) => mine.filter((r) => r.key === key);
    // Un élément sans libellé ni en français, ni en anglais, ni en "mul" est ignoré (on n'affiche pas "Q12345")
    const isEntity = (v) => /^https?:\/\/www\.wikidata\.org\/entity\//.test(v || "");
    const labels = (key) => [...new Set(all(key).map((r) => r.valueLabel || (isEntity(r.value) ? null : r.value)).filter(Boolean))];
    const first = (key) => all(key)[0] || null;
    const articleTitle = (url) => (url ? decodeURIComponent(url.split("/wiki/")[1] || "").replace(/_/g, " ") : null);
    const highest = first("highestPoint");

    return {
      id: lastPart(item),
      wikipediaTitle: articleTitle(first("wikipedia")?.value),
      wikivoyageTitle: articleTitle(first("wikivoyage")?.value),
      images: all("image").map((r) => https(r.value)),   // fichiers Commons (sans largeur : voir utils/images.js)
      highestPoint: highest?.valueLabel ? { name: highest.valueLabel, elevation: highest.extra ? Math.round(Number(highest.extra)) : null } : null,
      drivingSide: labels("drivingSide")[0] || null,
      plugTypes: labels("plugType"),
      voltage: first("voltage") ? Math.round(Number(first("voltage").value)) : null,
      emergency: labels("emergency"),
      timeZones: labels("timeZone"),
    };
  }

  // -------------------------------------------------------------------
  // 2. Les sites à voir : UNESCO, parcs nationaux, attractions
  //    Le pays est répété dans chaque branche : Wikidata filtre ainsi tout de suite
  //    les sites du pays, au lieu de parcourir les ~100 000 attractions du monde.
  // -------------------------------------------------------------------
  static sitesQuery(code) {
    return `
SELECT ?site ?labelFr ?labelEn ?labelMul ?image ?coord ?article ?links ?heritage ?park WHERE {
  ?country wdt:P297 "${iso(code)}" .
  {
    { ?site wdt:P1435 wd:Q9259 ; wdt:P17 ?country . BIND("unesco" AS ?heritage) }
    UNION { ?site wdt:P31 wd:Q46169 ; wdt:P17 ?country . BIND("park" AS ?park) }
    UNION { ?site wdt:P31 wd:Q570116 ; wdt:P17 ?country . }
  }
  ?site wikibase:sitelinks ?links .
  OPTIONAL { ?site wdt:P18 ?image . }
  OPTIONAL { ?site wdt:P625 ?coord . }
  OPTIONAL { ?article schema:about ?site ; schema:isPartOf <https://fr.wikipedia.org/> . }
  ${WikidataClient.labels("?site")}
}
ORDER BY DESC(?links)
LIMIT 150`;
  }

  async sites(code) {
    const rows = await this.sparql(WikidataClient.sitesQuery(code));
    const sites = new Map();
    for (const row of rows) {
      const id = lastPart(row.site);
      const point = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/i.exec(row.coord || "");   // "Point(…)" ou "POINT(…)"
      const existing = sites.get(id);
      if (!existing) {
        sites.set(id, new Site({
          id,
          name: row.valueLabel,
          lat: point ? Number(point[2]) : null,
          lon: point ? Number(point[1]) : null,
          image: row.image ? https(row.image) : null,
          wikipedia: row.article || null,
          unesco: row.heritage === "unesco",
          park: row.park === "park",
          popularity: Number(row.links) || 0,
        }));
      } else {
        existing.unesco ||= row.heritage === "unesco";
        existing.park ||= row.park === "park";
        existing.image ||= row.image ? https(row.image) : null;
      }
    }
    return [...sites.values()]
      .filter((s) => s.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, SETTINGS.maxSites);
  }
}
