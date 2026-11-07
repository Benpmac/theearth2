// =====================================================================
// Reader — le mode lecture : un long texte, confortable à lire
// ---------------------------------------------------------------------
// Le site a beaucoup de texte (Wikipédia, le guide Wikivoyage). Dans la
// page, il est découpé en accordéons ; ici, on le lit comme un livre :
//   • une seule colonne d'environ 65 signes, interligne généreux ;
//   • la taille du texte, la police (sans ou avec empattements) et le fond
//     (papier, clair, nuit) se règlent, et le site s'en souvient ;
//   • un sommaire, une barre de progression et le temps de lecture.
//
//   Reader.open({
//     kicker: "Côte d'Ivoire · Le guide du voyageur",
//     title: "Avant de partir",
//     source: { label: "Wikivoyage, « Côte d'Ivoire »", url, licence: "CC BY-SA" },
//     sections: [{ title: "Comprendre le pays", load: () => blocs }],   // blocs : [{ type, text }]
//     start: 0,                                                          // section à ouvrir
//   })
//
// Une seule liseuse pour tout le site, sur l'élément <dialog> du navigateur
// (Échap pour fermer, focus gardé à l'intérieur, retour au bouton d'origine).
// Raccourcis : + et − pour la taille du texte.
// =====================================================================

import { externalLink, h, icon, skeleton } from "../utils/dom.js";
import { ThemeSwitch } from "./ThemeSwitch.js";
import { textBlocks } from "./chapters/Chapter.js";

const SIZES = [1.0625, 1.1875, 1.3125, 1.4375, 1.625];   // en rem : 17, 19, 21, 23 et 26 px
const FONTS = [["sans", "Sans", "Texte sans empattements (Inter)"], ["serif", "Serif", "Texte avec empattements (Fraunces)"]];
const THEMES = [["paper", "Papier"], ["light", "Clair"], ["night", "Nuit"]];
const WORDS_PER_MINUTE = 220;
const STORAGE_KEY = "reader";

export class Reader {
  static #shared = null;

  static open(doc) {
    Reader.#shared ??= new Reader();
    Reader.#shared.show(doc);
  }

  // Combien de minutes pour lire ces blocs ? (≈ 220 mots par minute)
  static readingMinutes(blocks) {
    const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).filter(Boolean).length, 0);
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  #dialog; #scroller; #article; #toc; #tocList; #tocToggle; #panel; #panelToggle; #bar; #kicker; #meta; #title; #end;
  #settings;
  #observer = null;
  #visit = 0;   // numéro d'ouverture : un chargement d'une lecture précédente ne vient pas se mélanger

  constructor() {
    this.#settings = Reader.#loadSettings();

    // --- Les réglages
    const sizeDown = h("button", { type: "button", class: "reader__btn", "aria-label": "Texte plus petit", title: "Texte plus petit (−)", onClick: () => this.#resize(-1) }, h("span", { class: "reader__a reader__a--small", "aria-hidden": "true" }, "A"));
    const sizeUp = h("button", { type: "button", class: "reader__btn", "aria-label": "Texte plus grand", title: "Texte plus grand (+)", onClick: () => this.#resize(1) }, h("span", { class: "reader__a", "aria-hidden": "true" }, "A"));
    const fonts = h("div", { class: "reader__seg", role: "group", "aria-label": "Police" }, FONTS.map(([value, label, title]) =>
      h("button", { type: "button", "data-font": value, title, onClick: () => this.#set({ font: value }) }, label)));
    const themes = h("div", { class: "reader__seg", role: "group", "aria-label": "Fond" }, THEMES.map(([value, label]) =>
      h("button", { type: "button", "data-theme-choice": value, title: `Fond ${label.toLowerCase()}`, onClick: () => this.#set({ theme: value }) },
        h("span", { class: `reader__swatch reader__swatch--${value}`, "aria-hidden": "true" }), h("span", { class: "reader__seg-label" }, label))));
    this.#tocToggle = h("button", { type: "button", class: "reader__btn reader__toc-toggle", "aria-expanded": "false", "aria-controls": "reader-toc", onClick: () => this.#toggleToc() },
      icon("list"), h("span", {}, "Sommaire"));
    // Sur téléphone, les réglages se rangent derrière un bouton « Aa » (comme dans les applis de lecture)
    this.#panel = h("div", { class: "reader__settings", id: "reader-settings", role: "group", "aria-label": "Réglages de lecture" }, sizeDown, sizeUp, fonts, themes);
    this.#panelToggle = h("button", { type: "button", class: "reader__btn reader__settings-toggle", "aria-expanded": "false", "aria-controls": "reader-settings", "aria-label": "Réglages de lecture", onClick: () => this.#togglePanel() },
      h("span", { class: "reader__a", "aria-hidden": "true" }, "Aa"));

    this.#kicker = h("p", { class: "reader__kicker" });
    this.#bar = h("div", { class: "reader__progress", "aria-hidden": "true" }, h("span"));
    const close = h("button", { type: "button", class: "reader__btn reader__close", onClick: () => this.#dialog.close() }, icon("close"), h("span", {}, "Fermer"));

    // --- Le texte
    this.#meta = h("p", { class: "reader__meta" });
    this.#title = h("h1", { class: "reader__title", id: "reader-title", tabindex: "-1" });
    this.#article = h("div", { class: "reader__sections" });
    this.#end = h("footer", { class: "reader__end" });
    this.#tocList = h("ol", { class: "reader__toc-list" });
    this.#toc = h("nav", { class: "reader__toc", id: "reader-toc", "aria-label": "Sommaire" }, h("p", { class: "reader__toc-title" }, "Sommaire"), this.#tocList);

    this.#scroller = h("div", { class: "reader__scroll" },
      h("div", { class: "reader__layout" },
        this.#toc,
        h("article", { class: "reader__article", "aria-labelledby": "reader-title" }, this.#meta, this.#title, this.#article, this.#end)));

    this.#dialog = h("dialog", { class: "reader", "aria-labelledby": "reader-title" },
      this.#bar,
      h("header", { class: "reader__head" },
        h("div", { class: "reader__head-start" }, close, this.#kicker),
        h("div", { class: "reader__tools" }, this.#tocToggle, this.#panelToggle, this.#panel)),
      this.#scroller);

    // La barre de progression suit le défilement
    this.#scroller.addEventListener("scroll", () => {
      const max = this.#scroller.scrollHeight - this.#scroller.clientHeight;
      this.#bar.firstChild.style.transform = `scaleX(${max > 0 ? Math.min(1, this.#scroller.scrollTop / max) : 1})`;
    }, { passive: true });

    // + et − : taille du texte
    this.#dialog.addEventListener("keydown", (event) => {
      if (event.target.closest("input, textarea")) return;
      if (event.key === "+" || event.key === "=") this.#resize(1);
      if (event.key === "-" || event.key === "−") this.#resize(-1);
    });
    this.#dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("has-reader");
      this.#observer?.disconnect();
      this.#toggleToc(false);
      this.#togglePanel(false);
    });
    document.body.append(this.#dialog);
    this.#apply();
  }

  show({ kicker = "", title, source = null, sections, start = 0 }) {
    const visit = ++this.#visit;
    this.#kicker.textContent = kicker;
    this.#title.textContent = title;
    this.#meta.textContent = source?.name || "";
    this.#toggleToc(false);
    this.#togglePanel(false);

    // Une section par rubrique ; chacune se remplit dès que son texte arrive
    const parts = sections.map((s, i) => {
      const body = h("div", { class: "reader__section-body" }, skeleton(5));
      const el = h("section", { class: "reader__section", id: `reader-s-${i}`, "aria-labelledby": s.title ? `reader-h-${i}` : null },
        s.title ? h("h2", { id: `reader-h-${i}` }, s.title) : null, body);
      return { ...s, el, body, blocks: [] };
    });
    this.#article.replaceChildren(...parts.map((p) => p.el));
    this.#tocList.replaceChildren(...parts.filter((p) => p.title).map((p) =>
      h("li", {}, h("a", {
        href: `#${p.el.id}`, "data-target": p.el.id,
        onClick: (event) => { event.preventDefault(); this.#goTo(p.el); this.#toggleToc(false); },
      }, p.title))));
    this.#dialog.classList.toggle("reader--single", parts.filter((p) => p.title).length < 2);
    this.#end.replaceChildren(
      source ? h("p", {}, "Source : ", source.url ? externalLink(source.url, source.label) : source.label, source.licence ? ` · ${source.licence}` : "") : null,
      h("button", { type: "button", class: "btn btn--outline btn--small", onClick: () => this.#dialog.close() }, "Fermer la lecture"));

    document.documentElement.classList.add("has-reader");
    this.#scroller.scrollTop = 0;
    this.#bar.firstChild.style.transform = "scaleX(0)";
    if (!this.#dialog.open) this.#dialog.showModal();
    this.#title.focus({ preventScroll: true });
    this.#watchToc(parts);

    // Le texte de chaque rubrique (souvent déjà en mémoire : la page l'a chargé)
    const loads = parts.map(async (p) => {
      try {
        p.blocks = (await p.load()) || [];
        if (visit !== this.#visit) return;
        p.body.replaceChildren(p.blocks.length ? textBlocks(p.blocks) : h("p", { class: "reader__empty" }, "Rubrique vide pour l'instant."));
      } catch {
        if (visit !== this.#visit) return;
        p.body.replaceChildren(h("p", { class: "reader__empty" }, "Cette rubrique n'a pas pu être chargée. Ferme la lecture et rouvre-la pour réessayer."));
      }
    });
    Promise.allSettled(loads).then(() => {
      if (visit !== this.#visit) return;
      const minutes = Reader.readingMinutes(parts.flatMap((p) => p.blocks));
      this.#meta.textContent = [source?.name, `${minutes} min de lecture`].filter(Boolean).join(" · ");
      // Ouvert sur une rubrique précise : on y va une fois tout le texte en place (sinon la page bouge)
      if (start > 0 && parts[start]) this.#goTo(parts[start].el, "auto");
    });
  }

  // --- Réglages -------------------------------------------------------
  #resize(step) {
    this.#set({ size: Math.max(0, Math.min(SIZES.length - 1, this.#settings.size + step)) });
  }

  #set(change) {
    // On garde le passage du texte qu'on lisait à la même place après un changement de taille ou de police
    const ratio = this.#scroller.scrollTop / Math.max(1, this.#scroller.scrollHeight);
    Object.assign(this.#settings, change);
    this.#apply();
    this.#scroller.scrollTop = ratio * this.#scroller.scrollHeight;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#settings));
    } catch {
      // Navigation privée : les réglages valent pour cette visite
    }
  }

  #apply() {
    const { size, font, theme } = this.#settings;
    this.#dialog.style.setProperty("--reader-size", `${SIZES[size]}rem`);
    this.#dialog.dataset.font = font;
    this.#dialog.dataset.readerTheme = theme;
    this.#dialog.querySelectorAll("[data-font]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.font === font)));
    this.#dialog.querySelectorAll("[data-theme-choice]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === theme)));
    const [down, up] = this.#panel.querySelectorAll(":scope > .reader__btn");
    if (down) down.disabled = size === 0;
    if (up) up.disabled = size === SIZES.length - 1;
  }

  static #loadSettings() {
    const defaults = {
      size: window.matchMedia("(max-width: 640px)").matches ? 1 : 2,
      font: "serif",
      theme: ThemeSwitch.isDark ? "night" : "paper",
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && SIZES[saved.size] && FONTS.some(([f]) => f === saved.font) && THEMES.some(([t]) => t === saved.theme)) return saved;
    } catch {
      // Stockage indisponible ou réglage illisible : on prend les réglages par défaut
    }
    return defaults;
  }

  // --- Sommaire ------------------------------------------------------
  #goTo(el, behavior = "smooth") {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : behavior });
  }

  #toggleToc(force) {
    const open = force ?? !this.#toc.classList.contains("is-open");
    this.#toc.classList.toggle("is-open", open);
    this.#tocToggle.setAttribute("aria-expanded", String(open));
    if (open) this.#togglePanel(false);
  }

  #togglePanel(force) {
    const open = force ?? !this.#panel.classList.contains("is-open");
    this.#panel.classList.toggle("is-open", open);
    this.#panelToggle.setAttribute("aria-expanded", String(open));
    if (open) this.#toggleToc(false);
  }

  // La rubrique en cours de lecture est signalée dans le sommaire
  #watchToc(parts) {
    this.#observer?.disconnect();
    this.#observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        this.#tocList.querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.target === entry.target.id));
      }
    }, { root: this.#scroller, rootMargin: "-15% 0px -75% 0px" });
    parts.forEach((p) => this.#observer.observe(p.el));
  }
}
