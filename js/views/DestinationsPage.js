// =====================================================================
// DestinationsPage — l'accueil : tous les pays, rangés par continent, de A à Z
// ---------------------------------------------------------------------
// Dans la version simple, c'est la porte d'entrée du site (#/) : chaque
// pays et territoire est à un clic, y compris les micro-États.
// Le filtre par continent est dans l'adresse (#/destinations/Afrique) :
// on peut le partager, et le bouton Précédent le respecte.
// =====================================================================

import { h } from "../utils/dom.js";
import { SiteFooter } from "./SiteFooter.js";
import { View } from "./View.js";

// "Amériques" → "ameriques" : sert à choisir l'image du bandeau dans destinations.css
const slug = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export class DestinationsPage extends View {
  #region = null;

  get documentTitle() {
    return this.#region ? `${this.#region} · Destinations · TheEarth` : "TheEarth · Visitez un pays depuis votre canapé";
  }

  enter([region]) {
    const regions = this.planet.byRegion();
    this.#region = regions.some(([name]) => name === region) ? region : null;

    const chip = (name, label) => h("a", {
      class: "filter",
      href: name ? `#/destinations/${encodeURIComponent(name)}` : "#/destinations",
      "aria-current": (name || null) === this.#region ? "true" : null,
    }, label);

    const shown = regions.filter(([name]) => !this.#region || name === this.#region);
    const total = shown.reduce((n, [, list]) => n + list.length, 0);

    this.root.replaceChildren(
      h("header", { class: "page-hero", "data-region": this.#region ? slug(this.#region) : "tous" },
        h("p", { class: "page-hero__eyebrow" }, "Destinations"),
        h("h1", { class: "page-hero__title" }, this.#region ? `Voyager ${this.#region === "Amériques" ? "aux" : "en"} ${this.#region}` : "Où partir aujourd'hui ?"),
        h("p", { class: "page-hero__lead" }, `${total} pays et territoires, de A à Z. Choisis-en un pour ouvrir sa page.`)),
      h("nav", { class: "filters filters--regions", "aria-label": "Filtrer par continent" },
        chip(null, "Tous"), regions.map(([name, list]) => chip(name, `${name} (${list.length})`))),
      ...shown.map(([name, list]) =>
        h("section", { class: "destinations", "aria-labelledby": `dest-${list[0].code}` },
          h("h2", { class: "destinations__title", id: `dest-${list[0].code}` }, name),
          h("ul", { class: "destinations__list", role: "list" }, list.map((c) =>
            h("li", {}, h("a", { class: "destination", href: `#/pays/${c.code}` },
              h("img", { class: "destination__flag", src: c.flag, alt: "", width: 48, height: 36, loading: "lazy", decoding: "async" }),
              h("span", { class: "destination__text" },
                h("strong", { class: "destination__name" }, c.name),
                h("small", { class: "destination__meta" }, c.capitalNames[0] || c.subregion || "")))))))),
      SiteFooter.render());

    window.scrollTo(0, 0);
  }

  leave() {
    this.root.replaceChildren();
  }
}
