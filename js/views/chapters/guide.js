// =====================================================================
// GuideChapter — des rubriques du guide Wikivoyage, en accordéons
// ---------------------------------------------------------------------
// Une classe "abstraite" : elle sait afficher n'importe quelle liste de
// rubriques, chargées seulement quand on les ouvre. Ses sous-classes
// ne font que choisir LEURS rubriques (membre statique SECTIONS) :
//
//   BeforeYouGoChapter  (étape Préparer)  comprendre, y aller, argent, santé, sécurité
//   OnSiteChapter       (étape Sur place) se déplacer, que faire, parler, coutumes, se loger
//
// Même code, deux usages : c'est l'héritage au service de la réutilisation.
// =====================================================================

import { externalLink, h, icon, notice, skeleton, source } from "../../utils/dom.js";
import { Reader } from "../Reader.js";
import { Chapter, textBlocks } from "./Chapter.js";

export class GuideChapter extends Chapter {
  static SECTIONS = [];   // [clé de rubrique (voir MediaWikiClients.js), titre affiché]
  hideWhenEmpty = true;   // pas de guide Wikivoyage pour ce pays : le chapitre disparaît

  load() {
    return this.country.travelGuide();
  }

  get available() {
    return this.constructor.SECTIONS;
  }

  isEmpty(guide) {
    return !guide || !this.available.some(([key]) => guide.sections[key]);
  }

  // Dans la page : les 10 premiers paragraphes de chaque rubrique ; le texte entier en mode lecture
  static INLINE_BLOCKS = 10;

  render(guide) {
    const rubriques = this.available.filter(([key]) => guide.sections[key]);
    const openReader = (start = 0) => Reader.open({
      kicker: `${this.country.name} · Le guide du voyageur`,
      title: this.title,
      source: { name: "Wikivoyage", label: `Wikivoyage, « ${guide.title} »`, url: guide.url, licence: "CC BY-SA" },
      sections: rubriques.map(([key, label]) => ({ title: label, load: async () => (await this.country.guideSection(key))?.blocks || [] })),
      start,
    });

    const items = rubriques.map(([key, label], i) => {
      const content = h("div", { class: "accordion__content" }, skeleton());
      const details = h("details", { class: "accordion", open: i === 0 },
        h("summary", { class: "accordion__summary" }, label), content);
      let loaded = false;
      const load = async () => {
        if (loaded) return;
        loaded = true;
        try {
          const section = await this.country.guideSection(key);
          if (this.aborted) return;
          const blocks = section?.blocks || [];
          const more = blocks.length > GuideChapter.INLINE_BLOCKS;
          content.replaceChildren(
            blocks.length ? textBlocks(blocks.slice(0, GuideChapter.INLINE_BLOCKS)) : notice("Rubrique vide pour l'instant."),
            blocks.length ? h("button", { type: "button", class: "btn btn--outline btn--small accordion__more", onClick: () => openReader(i) },
              icon("book"), more ? "Lire la suite en mode lecture" : "Lire en mode lecture") : null);
        } catch {
          loaded = false;
          content.replaceChildren(notice("Cette rubrique n'a pas pu être chargée. Referme-la et rouvre-la pour réessayer.", { error: true }));
        }
      };
      details.addEventListener("toggle", () => details.open && load());
      if (i === 0) load();
      return details;
    });
    return [
      h("div", { class: "chapter__actions" },
        h("button", { type: "button", class: "btn btn--primary btn--small", onClick: () => openReader(0) }, icon("book"), "Lire tout le guide"),
        h("span", { class: "muted" }, `${rubriques.length} rubriques, dans une page faite pour lire`)),
      h("div", { class: "accordions" }, items),
      source("Extraits de ", externalLink(guide.url, `Wikivoyage, « ${guide.title} »`), " · CC BY-SA · le guide complet en dit plus (adresses, prix, horaires)."),
    ];
  }
}

// ---------------------------------------------------------------------
export class BeforeYouGoChapter extends GuideChapter {
  static id = "avant-de-partir";
  static title = "Avant de partir";
  static SECTIONS = [
    ["understand", "Comprendre le pays"],
    ["getIn", "Y aller : visas, vols, frontières"],
    ["money", "Argent et achats"],
    ["health", "Santé"],
    ["safety", "Sécurité"],
  ];
}

// ---------------------------------------------------------------------
export class OnSiteChapter extends GuideChapter {
  static id = "sur-place";
  static title = "Le guide sur place";
  static SECTIONS = [
    ["getAround", "Se déplacer"],
    ["do", "Que faire"],
    ["talk", "Parler la langue"],
    ["respect", "Coutumes et savoir-vivre"],
    ["sleep", "Se loger"],
  ];
}
