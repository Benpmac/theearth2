// =====================================================================
// App — le chef d'orchestre
// ---------------------------------------------------------------------
// Il possède la planète, le routeur et les écrans. À chaque changement
// d'adresse, il cache l'écran courant et affiche le bon, puis met à jour
// la navigation et le titre de l'onglet.
//
//   #/                        toutes les destinations (l'accueil)
//   #/pays/CI                 la page d'un pays
//   #/destinations            tous les pays, par continent
//   #/destinations/Afrique    … filtrés sur un continent
//   #/hasard                  un pays tiré au sort (l'adresse devient #/pays/XX)
//   #/avis   ·   #/avis/CI    le formulaire « Ton avis » (pays déjà choisi)
// =====================================================================

import { CountryPage } from "../views/CountryPage.js";
import { DestinationsPage } from "../views/DestinationsPage.js";
import { FeedbackPage } from "../views/FeedbackPage.js";
import { SearchBox } from "../views/SearchBox.js";
import { ThemeSwitch } from "../views/ThemeSwitch.js";
import { Router } from "./Router.js";

// Adresse → écran, et rubrique de navigation correspondante
const ROUTES = {
  "": { view: "destinations", nav: "destinations" },   // version simple : l'accueil, ce sont les destinations
  pays: { view: "country", nav: null },          // une page pays n'est dans aucune rubrique : le fil d'Ariane situe
  destinations: { view: "destinations", nav: "destinations" },
  avis: { view: "feedback", nav: "feedback" },
};

export class App {
  #current = null;

  constructor(planet) {
    this.planet = planet;
    this.router = new Router();

    const page = (name) => document.querySelector(`main [data-page="${name}"]`);
    this.views = {
      country: new CountryPage(page("country"), this),
      destinations: new DestinationsPage(page("destinations"), this),
      feedback: new FeedbackPage(page("feedback"), this),
    };

    // Au départ, tous les écrans sont cachés : le routeur affichera le bon
    Object.values(this.views).forEach((v) => (v.root.hidden = true));

    // Recherche de la barre du haut : toujours vers la page du pays
    new SearchBox(document.querySelector("#top-search"), planet, {
      label: "Chercher un pays",
      onSelect: (country) => this.router.go(`pays/${country.code}`),
    });

    // Bouton soleil/lune : sombre par défaut, clair sur demande (choix retenu)
    new ThemeSwitch(document.querySelector(".theme-switch"));

    // Onglet « Rechercher » (téléphone) : on remonte en haut et on place le curseur dans la recherche
    document.querySelector('[data-action="search"]')?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("#top-search input")?.focus({ preventScroll: true });
    });

    // Raccourci clavier "/" pour aller à la recherche
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && !event.target.closest("input, select, textarea, dialog")) {
        event.preventDefault();
        document.querySelector("#top-search input")?.focus();
      }
    });

    // Le lien d'évitement ne doit pas changer l'adresse (elle sert au routeur)
    document.querySelector(".skip-link").addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("main").focus();
    });

    this.router.onChange((route) => this.#show(route));
  }

  start() {
    this.router.start();
  }

  #show({ page, params }) {
    // "Au hasard" : on tire un pays et on remplace l'adresse (le bouton Précédent
    // ramène alors à la page d'avant, pas à un nouveau tirage)
    if (page === "hasard") {
      const country = this.planet.random();
      history.replaceState(null, "", `#/pays/${country.code}`);
      page = "pays";
      params = [country.code];
    }

    const route = ROUTES[page] || ROUTES[""];
    const view = this.views[route.view];
    if (this.#current && this.#current !== view) this.#current.hide();
    this.#current = view;
    document.body.dataset.screen = route.view;   // permet au CSS d'adapter la mise en page à l'écran
    view.show(params);
    document.title = view.documentTitle;

    // La rubrique active est signalée visuellement et aux lecteurs d'écran
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === route.nav) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
}
