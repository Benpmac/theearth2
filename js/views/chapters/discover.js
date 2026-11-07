// =====================================================================
// Étape "Découvrir" : Bienvenue · L'essentiel
// ---------------------------------------------------------------------
// Mise en page en deux colonnes (voir .group--decouvrir dans country.css) :
//   à gauche, le texte de présentation et trois chiffres dans des ronds ;
//   à droite, les points clés en cartes à icône (capitale, langue, monnaie, relief).
// =====================================================================

import { externalLink, h, icon, source } from "../../utils/dom.js";
import { formatCompact, formatInt, formatPeople } from "../../utils/format.js";
import { Reader } from "../Reader.js";
import { Chapter } from "./Chapter.js";

// ---------------------------------------------------------------------
export class WelcomeChapter extends Chapter {
  static id = "bienvenue";
  static title = "Bienvenue";

  load() {
    return this.country.introduction();
  }

  isEmpty(page) {
    return !page || !page.paragraphs.length;
  }

  render(page) {
    const c = this.country;
    const text = h("div", { class: "prose prose--lead" }, page.paragraphs.map((p) => h("p", {}, p)));
    const more = page.paragraphs.length > 2
      ? h("button", {
          class: "btn btn--outline btn--small", type: "button", "aria-expanded": "false",
          onClick: (event) => {
            const open = text.classList.toggle("is-open");
            event.currentTarget.textContent = open ? "Réduire" : "Lire la suite";
            event.currentTarget.setAttribute("aria-expanded", String(open));
          },
        }, "Lire la suite")
      : null;

    // Trois chiffres, connus dès le chargement (aucune attente)
    const stat = (iconName, value, label) =>
      h("li", { class: "stat" },
        h("span", { class: "stat__icon" }, icon(iconName)),
        h("strong", { class: "stat__value" }, value),
        h("span", { class: "stat__label" }, label));
    const neighbours = c.neighbors.length;

    const read = h("button", {
      class: "btn btn--primary btn--small", type: "button",
      onClick: () => Reader.open({
        kicker: `${c.name} · Présentation`,
        title: page.title,
        source: { name: "Wikipédia", label: `Wikipédia, « ${page.title} »`, url: page.url, licence: "CC BY-SA" },
        sections: [{ title: null, load: () => page.paragraphs.map((text) => ({ type: "p", text })) }],
      }),
    }, icon("book"), "Mode lecture");

    return [
      text,
      h("div", { class: "chapter__actions" }, read, more, source("Texte : ", externalLink(page.url, `Wikipédia, « ${page.title} »`), " · CC BY-SA")),
      h("ul", { class: "stats", role: "list" },
        c.population ? stat("people", formatCompact(c.population), `habitants en ${c.populationYear}`) : null,
        c.area ? stat("area", formatInt(c.area), "km² de superficie") : null,
        stat("compass", formatInt(neighbours), neighbours > 1 ? "pays voisins" : neighbours === 1 ? "pays voisin" : "pays voisin : une île ou un territoire isolé")),
    ];
  }
}

// ---------------------------------------------------------------------
// Ce qu'un voyageur veut savoir d'un coup d'œil : tout est déjà dans l'objet Country,
// sauf le point culminant (Wikidata), ajouté s'il arrive. Les pays voisins sont en bas
// de la page (« Continuer le voyage »), avec la distance entre les capitales.
export class EssentialsChapter extends Chapter {
  static id = "essentiel";
  static title = "L'essentiel";
  static hideTitle = true;   // les cartes parlent d'elles-mêmes (titre gardé pour les lecteurs d'écran)

  async load() {
    return { profile: await this.country.profile().catch(() => null) };
  }

  render({ profile }) {
    const c = this.country;
    const high = profile?.highestPoint;
    const capital = c.capital;
    const biggest = c.cities[0] || null;
    const money = c.mainCurrency;

    const feature = (iconName, label, value, note) =>
      h("li", { class: "feature" },
        h("span", { class: "feature__icon" }, icon(iconName)),
        h("div", { class: "feature__text" },
          h("p", { class: "feature__label" }, label),
          h("p", { class: "feature__value" }, value),
          note ? h("p", { class: "feature__note" }, note) : null));

    const capitalNote = capital && biggest && biggest !== capital
      ? `Plus grande ville : ${biggest.name}, ${formatPeople(biggest.population)} d'habitants`
      : capital ? `La plus grande ville du pays, ${formatPeople(capital.population)} d'habitants` : null;

    return h("ul", { class: "features", role: "list" },
      feature("pin", c.capitalNames.length > 1 ? "Capitales" : "Capitale", c.capitalNames.join(", ") || "Pas de capitale officielle", capitalNote),
      feature("chat", c.languages.length > 1 ? "Langues officielles" : "Langue officielle", c.languages.join(", ") || "—",
        c.demonyms.filter(Boolean).length ? `On les appelle : ${c.demonyms.filter(Boolean).join(", ")}` : null),
      feature("coins", c.currencies.length > 1 ? "Monnaies" : "Monnaie", money ? money.name : "—",
        money ? [`Code ${money.code}`, money.symbol ? `symbole ${money.symbol}` : null, c.currencies.length > 1 ? `et ${c.currencies.length - 1} autre${c.currencies.length > 2 ? "s" : ""}` : null].filter(Boolean).join(" · ") : null),
      high
        ? feature("mountain", "Point culminant", high.name,
            [high.elevation ? `${formatInt(high.elevation)} m d'altitude` : null, c.landlocked ? "pays sans accès à la mer" : "pays ouvert sur la mer"].filter(Boolean).join(" · "))
        : feature("mountain", "Accès à la mer", c.landlocked ? "Non, pays enclavé" : "Oui", null));
  }
}
