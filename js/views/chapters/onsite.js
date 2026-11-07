// =====================================================================
// Étape "Sur place" : Manger et boire
// (le chapitre "Le guide sur place" est dans guide.js)
// =====================================================================

import { externalLink, h, icon, source } from "../../utils/dom.js";
import { Reader } from "../Reader.js";
import { Chapter, textBlocks, valueOf } from "./Chapter.js";

export class FoodChapter extends Chapter {
  static id = "manger-boire";
  static title = "Manger et boire";
  hideWhenEmpty = true;

  async load() {
    const [eat, drink] = await Promise.allSettled([this.country.guideSection("eat"), this.country.guideSection("drink")]);
    return { eat: valueOf(eat), drink: valueOf(drink) };
  }

  isEmpty({ eat, drink }) {
    return !eat?.blocks?.length && !drink?.blocks?.length;
  }

  render({ eat, drink }) {
    const columns = [];
    if (eat?.blocks?.length) columns.push(h("div", {}, h("h4", { class: "chapter__subtitle" }, "Manger"), textBlocks(eat.blocks.slice(0, 8))));
    if (drink?.blocks?.length) columns.push(h("div", {}, h("h4", { class: "chapter__subtitle" }, "Boire et sortir"), textBlocks(drink.blocks.slice(0, 6))));
    const guideUrl = (eat || drink)?.url;
    const sections = [
      eat?.blocks?.length ? { title: "Manger", load: () => eat.blocks } : null,
      drink?.blocks?.length ? { title: "Boire et sortir", load: () => drink.blocks } : null,
    ].filter(Boolean);
    const read = h("button", {
      type: "button", class: "btn btn--primary btn--small",
      onClick: () => Reader.open({
        kicker: `${this.country.name} · Le guide du voyageur`,
        title: "Manger et boire",
        source: { name: "Wikivoyage", label: "Wikivoyage", url: guideUrl, licence: "CC BY-SA" },
        sections,
      }),
    }, icon("book"), "Mode lecture");
    return [
      h("div", { class: "columns" }, columns),
      h("div", { class: "chapter__actions" }, read, source("Extraits de ", externalLink(guideUrl, "Wikivoyage"), " · CC BY-SA")),
    ];
  }
}
