// =====================================================================
// SiteFooter — le pied de page : qui a fait le site, et toutes ses sources
// ---------------------------------------------------------------------
// Affiché en bas de la page d'un pays et de l'écran Destinations.
// Les personnes sont dans CREDITS (config.js) ; les sources sont ci-dessous,
// rangées par thème, chacune avec ce qu'elle apporte et sa licence.
// =====================================================================

import { CREDITS } from "../config.js";
import { externalLink, h, icon } from "../utils/dom.js";

// [nom, adresse, ce qu'elle apporte au site, licence]
const SOURCES = [
  ["Textes et guides", [
    ["Wikipédia", "https://fr.wikipedia.org", "présentation de chaque pays", "CC BY-SA 4.0"],
    ["Wikivoyage", "https://fr.wikivoyage.org", "guide du voyageur : se déplacer, manger, coutumes", "CC BY-SA 4.0"],
    ["Wikidata", "https://www.wikidata.org", "lieux des paysages, prises, tension, urgences, fuseaux", "CC0"],
  ]],
  ["Photos et nature", [
    ["Wikimedia Commons", "https://commons.wikimedia.org", "photos des bannières et des paysages", "licence de chaque photo"],
    ["Wikipédia en anglais", "https://en.wikipedia.org", "photos des lieux emblématiques (bannières, paysages)", "photos libres"],
    ["iNaturalist", "https://www.inaturalist.org", "faune et flore, photos des naturalistes", "Creative Commons"],
  ]],
  ["Météo, argent, calendrier", [
    ["Open-Meteo", "https://open-meteo.com", "météo du jour et climat de l'année", "CC BY 4.0"],
    ["ExchangeRate-API", "https://www.exchangerate-api.com", "taux de change", "accès ouvert"],
    ["date-holidays", "https://github.com/commenthol/date-holidays", "jours fériés", "ISC · CC BY 3.0"],
    ["Unicode CLDR", "https://cldr.unicode.org", "début de semaine et week-end", "licence Unicode"],
    ["Our World in Data", "https://ourworldindata.org", "population", "CC BY 4.0"],
    ["GeoNames", "https://www.geonames.org", "villes et capitales", "CC BY 4.0"],
  ]],
  ["Cartes, drapeaux et outils", [
    ["world-countries", "https://github.com/mledoze/countries", "fiches des pays", "ODbL"],
    ["flag-icons", "https://github.com/lipis/flag-icons", "drapeaux", "MIT"],
    ["Inter et Fraunces", "https://github.com/rsms/inter", "polices de caractères", "SIL OFL 1.1"],
    ["Web3Forms", "https://web3forms.com", "envoi des messages « Ton avis » par e-mail", "service gratuit"],
  ]],
];

// Ceux qui ont fait le contenu : toujours vrai, quel que soit l'auteur du site
const COMMUNITY = [
  { name: "Les bénévoles de Wikipédia, Wikivoyage et Wikidata", role: "Textes, guides et données" },
  { name: "Les photographes de Wikimedia Commons et d'iNaturalist", role: "Photos des pays et des espèces" },
];

export class SiteFooter {
  static SOURCES = SOURCES;

  static render() {
    const people = [...CREDITS.people, ...COMMUNITY];
    return h("footer", { class: "site-footer", "aria-labelledby": "footer-people" },
      h("div", { class: "site-footer__top" },
        h("div", { class: "site-footer__brand" },
          h("p", { class: "site-footer__logo" }, icon("globe"), h("span", {}, "The", h("em", {}, "Earth"))),
          h("p", { class: "site-footer__tagline" }, "Visitez un pays depuis votre canapé : une page pour chacun des 250 pays et territoires du monde."),
          h("a", { class: "btn btn--outline-light site-footer__cta", href: "#/avis" }, icon("chat"), "Donner mon avis"),
          h("h2", { class: "site-footer__heading", id: "footer-people" }, "Ceux qui ont fait le site"),
          h("ul", { class: "site-footer__people", role: "list" }, people.map((p) =>
            h("li", {}, h("strong", {}, p.name), h("span", {}, p.role))))),
        h("div", { class: "site-footer__sources" },
          h("h2", { class: "site-footer__heading" }, "Sources"),
          h("div", { class: "site-footer__cols" }, SOURCES.map(([theme, list]) =>
            h("section", { class: "site-footer__group" },
              h("h3", {}, theme),
              h("ul", { role: "list" }, list.map(([name, url, what, licence]) =>
                h("li", {},
                  externalLink(url, name),
                  h("span", {}, `${what} · ${licence}`))))))))),
      h("div", { class: "site-footer__bottom" },
        h("p", {}, `© ${new Date().getFullYear()} TheEarth · chaque texte, photo et donnée reste sous la licence de son auteur.`),
        h("nav", { "aria-label": "Plan du site" },
          h("ul", { class: "site-footer__nav", role: "list" },
            h("li", {}, h("a", { href: "#/" }, "Destinations")),
            h("li", {}, h("a", { href: "#/hasard" }, "Au hasard")),
            h("li", {}, h("a", { href: "#/avis" }, "Ton avis"))))));
  }
}
