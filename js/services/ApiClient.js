// =====================================================================
// ApiClient — la classe mère de tous les services extérieurs
// ---------------------------------------------------------------------
// Elle sait faire une chose, bien : demander du JSON à une adresse, avec
//   • un délai maximum (une API muette ne bloque pas la page) ;
//   • un cache partagé (deux demandes identiques = un seul appel réseau) ;
//   • des serveurs de secours, essayés dans l'ordre si le premier tombe ;
//   • des erreurs lisibles en français.
//
// Chaque service (Wikidata, Open-Meteo…) HÉRITE de cette classe avec
// `extends ApiClient` et n'ajoute que ses propres méthodes métier.
// =====================================================================

import { SETTINGS } from "../config.js";

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.service = null;   // rempli par ApiClient : "WikidataClient", "OpenMeteoClient"…
    this.url = null;       // l'adresse appelée, pour comprendre une panne dans la console
  }
}

export class ApiClient {
  // `static` : une seule mémoire pour TOUS les services (propriété de la classe, pas des instances)
  // `#` : champ privé, inaccessible depuis l'extérieur de la classe
  static #cache = new Map();

  #bases;
  #timeout;

  constructor(baseUrl, { timeout = SETTINGS.requestTimeout } = {}) {
    this.#bases = Array.isArray(baseUrl) ? baseUrl : [baseUrl];
    this.#timeout = timeout;
  }

  get baseUrl() {
    return this.#bases[0];
  }

  // Construit une URL : url("/places", { q: "Mali" }) → https://…/places?q=Mali
  url(path = "", params = {}, base = this.baseUrl) {
    const url = new URL(base + path);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }
    return url.toString();
  }

  // Demande du JSON ; si un serveur échoue (quelle qu'en soit la raison :
  // panne, serveur fermé, adresse obsolète…), essaie le serveur de secours suivant
  async get(path = "", params = {}) {
    let lastError = null;
    for (const base of this.#bases) {
      try {
        return await this.fetchJSON(this.url(path, params, base));
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  // Le cœur : un fetch avec délai et cache
  fetchJSON(url) {
    const cache = ApiClient.#cache;
    if (cache.has(url)) return cache.get(url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeout);
    const promise = fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 429) throw new ApiError("Le service reçoit trop de demandes. Réessaie dans une minute.", 429);
        if (!response.ok) throw new ApiError(`Le service a répondu ${response.status}.`, response.status);
        try {
          return await response.json();
        } catch {
          throw new ApiError("Le service a renvoyé une réponse illisible.", response.status);
        }
      })
      .catch((error) => {
        cache.delete(url);   // un échec n'est pas mémorisé : on pourra réessayer
        let apiError = error;
        if (!(error instanceof ApiError)) {
          apiError = error.name === "AbortError"
            ? new ApiError("Le service met trop de temps à répondre.")
            // fetch échoue sans détail : coupure réseau, serveur disparu, ou appel refusé par le navigateur (CORS)
            : new ApiError("Service injoignable. Vérifie ta connexion internet.");
        }
        apiError.service = this.constructor.name;
        apiError.url = url;
        // Une ligne claire dans la console (F12) : quel service, quelle adresse, quel problème
        console.warn(`[${apiError.service}] ${apiError.message}\n${url}`);
        throw apiError;
      })
      .finally(() => clearTimeout(timer));

    cache.set(url, promise);
    return promise;
  }
}
