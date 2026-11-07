// =====================================================================
// Taux de change et faune et flore : deux petites classes
// ---------------------------------------------------------------------
// Chacune hérite d'ApiClient (délai, cache, erreurs, serveurs de secours)
// et transforme les réponses brutes en objets de notre modèle.
// =====================================================================

import { API, SETTINGS } from "../config.js";
import { Species } from "../models/Species.js";
import { ApiClient, ApiError } from "./ApiClient.js";

// --- Taux de change (ExchangeRate-API, accès ouvert) ------------------
export class ExchangeClient extends ApiClient {
  constructor() {
    super(API.exchange);
  }

  async rates() {
    const json = await this.get();
    if (json.result !== "success") throw new ApiError("Taux de change indisponibles.");
    return { rates: json.rates, updated: json.time_last_update_utc };
  }

  // 1 unité de `from` vaut combien de `to` ? (tous les taux sont donnés pour 1 euro)
  static convert(rates, from, to) {
    return rates[from] && rates[to] ? rates[to] / rates[from] : null;
  }
}

// --- iNaturalist : les espèces les plus observées du pays --------------
export class INaturalistClient extends ApiClient {
  constructor() {
    super(API.inaturalist);
  }

  // iNaturalist a ses propres identifiants de lieux : on cherche celui du pays,
  // sous son nom anglais courant puis officiel ("DR Congo" → "Democratic Republic of the Congo")
  async placeId(country) {
    const names = [...new Set([country.englishName, country.englishOfficialName].filter(Boolean))];
    const same = (a, b) => (a || "").toLowerCase() === b.toLowerCase();
    let fallback = null;
    for (const name of names) {
      const json = await this.get("/places/autocomplete", { q: name, per_page: 20 });
      const countries = (json.results || []).filter((p) => p.admin_level === 0);
      const exact = countries.find((p) => names.some((n) => same(p.name, n) || same(p.display_name, n)));
      if (exact) return exact.id;
      fallback ||= countries.find((p) => names.some((n) => (p.name || "").toLowerCase().includes(n.toLowerCase())));
    }
    return fallback?.id || null;
  }

  async species(country) {
    const placeId = await this.placeId(country);
    if (!placeId) return [];
    const json = await this.get("/observations/species_counts", {
      place_id: placeId,
      quality_grade: "research",
      locale: "fr",
      per_page: SETTINGS.maxSpecies,
      iconic_taxa: Object.keys(Species.groups).join(","),
    });
    const species = (json.results || [])
      .filter((r) => r.taxon?.default_photo?.medium_url)
      .map((r, i) => new Species({
        id: r.taxon.id ?? null,
        name: r.taxon.preferred_common_name || null,
        scientificName: r.taxon.name,
        group: r.taxon.iconic_taxon_name,
        photo: r.taxon.default_photo.medium_url,
        photoCredit: r.taxon.default_photo.attribution || "",
        observations: r.count,
        worldObservations: r.taxon.observations_count ?? null,
        wikipedia: r.taxon.wikipedia_url || null,
        rank: i + 1,
      }));
    await this.#addSummaries(species);
    return species;
  }

  // Une description pour chaque espèce : le résumé Wikipédia qu'iNaturalist renvoie
  // pour un taxon (en français si possible), demandé pour toutes les espèces d'un coup.
  // Facultatif : en cas d'échec, les cartes s'affichent sans description.
  async #addSummaries(species) {
    const ids = species.map((s) => s.id).filter(Boolean);
    if (!ids.length) return;
    try {
      const json = await this.get(`/taxa/${ids.join(",")}`, { locale: "fr" });
      const byId = new Map((json.results || []).map((t) => [t.id, t]));
      for (const s of species) {
        const taxon = byId.get(s.id);
        if (!taxon) continue;
        s.summary = INaturalistClient.plainText(taxon.wikipedia_summary);
        s.worldObservations ??= taxon.observations_count ?? null;
      }
    } catch (error) {
      console.warn("[INaturalistClient] descriptions indisponibles :", error.message);
    }
  }

  // Le résumé arrive en HTML (<i>, <b>…) : on n'en garde que le texte, sans jamais l'insérer comme HTML
  static plainText(html) {
    if (!html) return null;
    const text = new DOMParser().parseFromString(html, "text/html").body.textContent.replace(/\s+/g, " ").trim();
    return text || null;
  }
}
