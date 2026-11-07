// =====================================================================
// Wikipédia et Wikivoyage : deux wikis, la même API (MediaWiki)
// ---------------------------------------------------------------------
// MediaWikiClient regroupe ce qui est commun ; WikipediaClient et
// WikivoyageClient en héritent et ajoutent leurs particularités.
// origin=* autorise l'appel depuis n'importe quel site (CORS).
// =====================================================================

import { API, DATA } from "../config.js";
import { isTravelPhoto } from "../utils/images.js";
import { ApiClient } from "./ApiClient.js";

class MediaWikiClient extends ApiClient {
  // Paramètres communs à toutes les requêtes MediaWiki
  query(params) {
    return this.get("", { format: "json", formatversion: 2, origin: "*", redirects: 1, ...params });
  }

  // Introduction d'un article, en texte brut découpé en paragraphes
  async intro(title) {
    const json = await this.query({
      action: "query",
      prop: "extracts|pageimages|info",
      exintro: 1,
      explaintext: 1,
      piprop: "thumbnail",
      pithumbsize: 960,   // une largeur standard de Wikimedia (les autres sont limitées)
      inprop: "url",
      titles: title,
    });
    const page = json?.query?.pages?.[0];
    if (!page || page.missing) return null;
    return {
      title: page.title,
      url: page.fullurl,
      image: page.thumbnail?.source || null,
      paragraphs: (page.extract || "").split("\n").map((p) => p.trim()).filter((p) => p.length > 40),
    };
  }
}

export class WikipediaClient extends MediaWikiClient {
  constructor() {
    super(API.wikipedia);
  }
}

// ---------------------------------------------------------------------
// LandmarkPhotoClient — la photo de bannière d'un pays
// Pour chaque pays, data/lieux-couverture.json donne 2 ou 3 lieux emblématiques
// (Machu Picchu, le Mont-Saint-Michel, la basilique de Yamoussoukro…), choisis
// parce que la photo de leur article est un paysage. On demande ces photos à la
// Wikipédia anglaise (la plus illustrée), en un seul appel, et on garde :
//   • les images sous licence libre, hébergées sur Wikimedia Commons ;
//   • de vraies photos (pas de carte, de drapeau ni de dessin) ;
//   • de préférence en paysage et d'au moins 1 600 px de large (nettes en grand).
// ---------------------------------------------------------------------
export class LandmarkPhotoClient extends MediaWikiClient {
  static #list = null;   // la liste des lieux, chargée une seule fois pour tout le site

  constructor() {
    super(API.wikipediaEn);
  }

  static #landmarks() {
    LandmarkPhotoClient.#list ??= fetch(DATA.landmarks).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    return LandmarkPhotoClient.#list;
  }

  // La photo de la bannière : de préférence un grand paysage. { file, title } ou null
  async coverFor(code) {
    const photos = await this.photosFor(code);
    const pick = photos.find((p) => p.wide) || photos[0];
    return pick ? { file: pick.file, title: pick.title } : null;
  }

  // Toutes les photos utilisables des lieux emblématiques du pays (chapitre « Paysages ») :
  // [{ file, title, article, wide }]. Même requête que pour la bannière : le cache
  // d'ApiClient fait qu'un seul appel sert aux deux.
  async photosFor(code) {
    const titles = (await LandmarkPhotoClient.#landmarks())[code] || [];
    if (!titles.length) return [];
    const json = await this.query({
      action: "query",
      prop: "pageimages|langlinks",
      piprop: "original|name",
      pilicense: "free",
      lllang: "fr",
      titles: titles.join("|"),
    });
    const q = json?.query || {};
    // Un titre peut être normalisé puis redirigé : on suit le fil pour garder l'ordre de préférence
    const follow = (title) => {
      for (const steps of [q.normalized, q.redirects]) title = steps?.find((s) => s.from === title)?.to || title;
      return title;
    };
    const pages = new Map((q.pages || []).map((p) => [p.title, p]));
    const usable = titles
      .map((t) => pages.get(follow(t)))
      .filter((p) => p && !p.missing && p.original && p.pageimage)
      .filter((p) => p.original.source.includes("/wikipedia/commons/") && isTravelPhoto(p.pageimage) && p.original.width >= 1200);
    const wiki = (lang, title) => `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
    return usable.map((p) => {
      const french = p.langlinks?.[0]?.title;   // le nom français du lieu, s'il existe
      return {
        file: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.pageimage)}`,
        title: french || p.title,
        article: french ? wiki("fr", french) : wiki("en", p.title),
        wide: p.original.width >= 1600 && p.original.width / p.original.height >= 1.25,
      };
    });
  }
}

// Les rubriques du guide Wikivoyage que l'on sait reconnaître (titres de la version française)
const GUIDE_SECTIONS = {
  understand: /^comprendre/i,
  getIn: /^aller\b|^arriver/i,
  getAround: /^circuler|^se déplacer/i,
  talk: /^(langues?|parler)/i,
  see: /^voir/i,
  do: /^faire/i,
  money: /^(acheter|argent)/i,
  eat: /^manger/i,
  drink: /^(boire|sortir)/i,
  sleep: /^(se loger|dormir|hébergement)/i,
  respect: /^respecter/i,
  safety: /^(sécurité|rester en sécurité|restez en sécurité)/i,
  health: /^(santé|rester en bonne santé)/i,
};

export class WikivoyageClient extends MediaWikiClient {
  constructor() {
    super(API.wikivoyage);
  }

  // Le plan de l'article : quelles rubriques existent, et à quel numéro
  async outline(title) {
    const json = await this.query({ action: "parse", page: title, prop: "sections" });
    if (!json.parse) return null;
    const sections = {};
    for (const s of json.parse.sections || []) {
      if (s.toclevel !== 1) continue;
      const line = s.line.replace(/<[^>]+>/g, "").trim();
      for (const [key, pattern] of Object.entries(GUIDE_SECTIONS)) {
        if (!sections[key] && pattern.test(line)) sections[key] = { index: s.index, title: line };
      }
    }
    return {
      title: json.parse.title,
      url: `https://fr.wikivoyage.org/wiki/${encodeURIComponent(json.parse.title.replace(/ /g, "_"))}`,
      sections,
    };
  }

  // Le contenu d'une rubrique, transformé en blocs de texte sûrs
  async section(title, index) {
    const json = await this.query({ action: "parse", page: title, section: index, prop: "text", disableeditsection: 1, disabletoc: 1 });
    return WikivoyageClient.toBlocks(json?.parse?.text || "");
  }

  // HTML → [{ type: "p" | "h" | "li", text }]
  // DOMParser crée un document inerte : aucun script ne s'exécute, aucune image ne se charge.
  // On n'en garde que le texte : rien du HTML d'origine n'entre dans notre page.
  static toBlocks(html, max = 120) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("table, figure, .thumb, style, script, sup, .mw-editsection, .noprint, .mw-empty-elt, .listing-metadata, .mw-kartographer-maplink").forEach((el) => el.remove());
    const blocks = [];
    for (const el of doc.body.querySelectorAll("p, h3, h4, li")) {
      if (el.closest("li") && el.tagName !== "LI") continue;
      if (el.tagName === "LI" && el.parentElement.closest("li")) continue;
      const text = el.textContent.replace(/\s+/g, " ").trim();
      if (text.length < 3) continue;
      blocks.push({ type: el.tagName === "P" ? "p" : el.tagName === "LI" ? "li" : "h", text: text.length > 4000 ? `${text.slice(0, 3997)}…` : text });
      if (blocks.length >= max) break;
    }
    return blocks;
  }
}
