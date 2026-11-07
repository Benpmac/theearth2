// =====================================================================
// Router — l'adresse de la page décide de l'écran affiché
// ---------------------------------------------------------------------
//   #/                         → toutes les destinations (l'accueil)
//   #/pays/CI                  → la page d'un pays
//   #/destinations/Afrique     → toutes les destinations (filtre facultatif)
//   #/hasard                   → un pays tiré au sort
// Chaque écran a donc un lien partageable, et le bouton Précédent marche.
// =====================================================================

export class Router {
  #listeners = new Set();

  constructor() {
    window.addEventListener("hashchange", () => this.#emit());
  }

  // "#/pays/CI" → { page: "pays", params: ["CI"] }
  get current() {
    const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    // Ancien format de la version 1 : #CI
    if (/^[A-Za-z]{2}$/.test(hash)) return { page: "pays", params: [hash.toUpperCase()] };
    const [page = "", ...params] = hash.split("/").filter(Boolean);
    return { page, params };
  }

  go(path) {
    const target = `#/${path}`;
    if (location.hash === target) this.#emit();
    else location.hash = target;
  }

  // Remplace l'adresse sans ajouter d'entrée dans l'historique (ex. changer de classement)
  replace(path) {
    history.replaceState(null, "", `#/${path}`);
  }

  onChange(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  start() {
    this.#emit();
  }

  #emit() {
    const route = this.current;
    this.#listeners.forEach((fn) => fn(route));
  }
}
