// =====================================================================
// Chapter — la classe mère de chaque chapitre de la page pays
// ---------------------------------------------------------------------
// Patron de conception "méthode modèle" (template method) :
// la classe mère écrit le déroulé, toujours le même —
//
//     squelette gris → load() → render(data)
//                            ↘ message si vide, ou erreur + "Réessayer"
//
// — et chaque sous-classe ne redéfinit que deux méthodes :
//     load()        va chercher les données (souvent via le pays : country.weather())
//     render(data)  renvoie les éléments HTML à afficher
//
// Un chapitre ne charge ses données que lorsqu'il approche de l'écran
// (la page appelle run() au bon moment) : on n'interroge pas 15 API
// pour un visiteur qui ne lira que le haut de la page.
// =====================================================================

import { h, notice, skeleton } from "../../utils/dom.js";

export class Chapter {
  static id = "chapitre";        // ancre HTML : #ch-meteo
  static title = "Chapitre";
  static icon = null;
  static lead = null;            // une phrase à droite du titre (en-tête "titre à gauche, texte à droite")
  static hideTitle = false;      // vrai : titre lu par les lecteurs d'écran mais pas affiché
  hideWhenEmpty = false;         // vrai : le chapitre disparaît s'il n'a rien à montrer
  emptyText = "Pas d'informations disponibles pour ce pays.";

  #started = false;
  #signal;

  constructor(country, page) {
    this.country = country;
    this.page = page;
    // Le signal de LA visite en cours, gardé dès la création : si l'on part vers un autre
    // pays, ce chapitre-ci sait qu'il ne doit plus rien afficher (même si la page, elle, continue)
    this.#signal = page.signal;
  }

  // Le titre peut dépendre du pays (ex. "Météo à Abidjan") : on redéfinit ce getter
  get title() {
    return this.constructor.title;
  }

  get signal() {
    return this.#signal;
  }

  get aborted() {
    return Boolean(this.signal?.aborted);
  }

  // Crée l'élément <section> du chapitre et l'ajoute à la page
  mount(parent) {
    const { id } = this.constructor;
    this.body = h("div", { class: "chapter__body" }, skeleton());
    const { lead, hideTitle } = this.constructor;
    this.el = h(
      "section",
      { class: `chapter chapter--${id}`, id: `ch-${id}`, "aria-labelledby": `ch-${id}-title` },
      h("header", { class: hideTitle ? "chapter__head visually-hidden" : "chapter__head" },
        h("h3", { class: "chapter__title", id: `ch-${id}-title` }, this.title),
        lead ? h("p", { class: "chapter__intro" }, lead) : null),
      this.body
    );
    parent.append(this.el);
    return this.el;
  }

  // Le déroulé commun (ne pas redéfinir)
  async run({ force = false } = {}) {
    if (this.#started && !force) return;
    this.#started = true;
    this.body.replaceChildren(skeleton());
    try {
      const data = await this.load();
      if (this.aborted) return;
      if (this.isEmpty(data)) {
        if (this.hideWhenEmpty) this.el.hidden = true;
        else this.body.replaceChildren(notice(this.emptyText));
        return;
      }
      this.body.replaceChildren(...[this.render(data)].flat(Infinity).filter(Boolean));
      this.afterRender?.(data);
    } catch (error) {
      if (this.aborted) return;
      console.warn(`Chapitre "${this.constructor.id}" :`, error);
      if (this.hideWhenEmpty) {
        this.el.hidden = true;
        return;
      }
      const retry = h("button", { class: "btn btn--small", type: "button", onClick: () => this.run({ force: true }) }, "Réessayer");
      this.body.replaceChildren(notice(`Ces informations n'ont pas pu être chargées. ${error.message || ""}`.trim(), { error: true, action: retry }));
    }
  }

  // --- À redéfinir dans les sous-classes ---------------------------
  async load() {
    return null;
  }

  render(_data) {
    throw new Error(`${this.constructor.name} doit définir render()`);
  }

  isEmpty(data) {
    return data === null || data === undefined || (Array.isArray(data) && data.length === 0);
  }
}

// Petites aides partagées par les chapitres -----------------------------

// Résultat d'un Promise.allSettled → la valeur, ou null en cas d'échec
export const valueOf = (settled) => (settled.status === "fulfilled" ? settled.value : null);

// Une liste de définitions : [["Capitale", "Yamoussoukro"], …]
export function factList(rows, className = "facts") {
  return h(
    "dl",
    { class: className },
    rows.filter((r) => r && r[1] !== null && r[1] !== undefined && r[1] !== "").map(([label, value, wide]) =>
      h("div", { class: wide ? "facts__item facts__item--wide" : "facts__item" }, h("dt", { class: "facts__label" }, label), h("dd", { class: "facts__value" }, value))
    )
  );
}

// Blocs de texte Wikivoyage → éléments HTML (texte uniquement)
export function textBlocks(blocks) {
  const out = [];
  let list = null;
  for (const block of blocks) {
    if (block.type === "li") {
      if (!list) out.push((list = h("ul", { class: "prose__list" })));
      list.append(h("li", {}, block.text));
      continue;
    }
    list = null;
    out.push(block.type === "h" ? h("h4", { class: "prose__subtitle" }, block.text) : h("p", {}, block.text));
  }
  return h("div", { class: "prose" }, out);
}
