// =====================================================================
// Étape "À voir" : Paysages, puis Faune et flore
// ---------------------------------------------------------------------
// Paysages : une mosaïque de photos des plus beaux lieux du pays ; une
// photo touchée s'ouvre en grand (PhotoViewer).
// Faune et flore : des fiches d'espèce en éventail sur une carte ancienne,
// la fiche du milieu en avant ; les autres reculent sur les côtés.
// =====================================================================

import { externalLink, h, icon, source } from "../../utils/dom.js";
import { formatCompact } from "../../utils/format.js";
import { inaturalistSrcset } from "../../utils/images.js";
import { Chapter } from "./Chapter.js";
import { PhotoViewer } from "../PhotoViewer.js";

// ---------------------------------------------------------------------
// Paysages : la première photo en grand, les autres autour (mosaïque).
// On garde 1, 2, 3, 5 ou 9 photos : des nombres qui remplissent la grille
// sans laisser de trou.
// ---------------------------------------------------------------------
export class LandscapesChapter extends Chapter {
  static id = "paysages";
  static title = "Paysages";
  static lead = "Parcs nationaux, sites du patrimoine mondial et lieux emblématiques : un avant-goût du voyage, en photos. Touche une photo pour l'agrandir.";
  hideWhenEmpty = true;   // pas de photo utilisable : le chapitre disparaît

  load() {
    return this.country.landscapes();
  }

  static fit(count) {
    return [9, 5, 3, 2, 1].find((n) => n <= count) || 0;
  }

  render(all) {
    const sites = all.slice(0, LandscapesChapter.fit(all.length));
    const viewer = new PhotoViewer(sites.map((s) => ({
      src: s.photo(1920),
      srcset: s.photoSrcset([960, 1280, 1920, 3840]),
      title: s.name,
      kind: s.kind,
      credit: s.photoPage,
      article: s.wikipedia,
    })));
    return [
      h("ul", { class: "landscapes", "data-count": sites.length, role: "list" }, sites.map((s, i) =>
        h("li", { class: "landscape" },
          h("button", { type: "button", class: "landscape__btn", "aria-label": `Agrandir la photo : ${s.name}`, onClick: () => viewer.open(i) },
            h("img", {
              src: s.photo(i === 0 ? 1280 : 500),
              srcset: s.photoSrcset(i === 0 ? [500, 960, 1280, 1920] : [330, 500, 960]),
              sizes: i === 0 ? "(min-width: 1100px) 560px, (min-width: 700px) 50vw, 100vw" : "(min-width: 1100px) 280px, (min-width: 700px) 25vw, 50vw",
              alt: "", loading: "lazy", decoding: "async",
              onLoad: (event) => event.currentTarget.classList.add("is-loaded"),
              onError: (event) => event.currentTarget.closest(".landscape").classList.add("is-broken"),
            }),
            h("span", { class: "landscape__caption" }, s.kind ? h("small", {}, s.kind) : null, h("strong", {}, s.name)))))),
      source("Photos : ", externalLink("https://commons.wikimedia.org", "Wikimedia Commons"), " (auteur et licence de chaque photo en l'agrandissant) · lieux : Wikidata et Wikipédia"),
    ];
  }
}

// ---------------------------------------------------------------------
// Faune et flore : des fiches d'espèce en éventail.
// La fiche au centre est en avant ; toucher une fiche sur le côté l'amène au centre.
// ---------------------------------------------------------------------
export class NatureChapter extends Chapter {
  static id = "nature";
  static title = "Faune et flore à observer";
  static lead = "Les espèces que les naturalistes d'iNaturalist observent le plus souvent dans le pays : de quoi savoir quoi chercher en balade.";
  emptyText = "Pas encore d'observations d'espèces publiées pour ce pays.";

  load() {
    return this.country.species();
  }

  // La première phrase du résumé, ou ~170 signes coupés à la fin d'un mot :
  // la fiche reste courte, le texte complet est sur iNaturalist (bouton rond)
  static shorten(text, max = 170) {
    if (!text) return null;
    const first = text.match(/^.+?[.!?](?=\s|$)/)?.[0] || text;
    if (first.length <= max) return first;
    return `${first.slice(0, first.lastIndexOf(" ", max))}…`;
  }

  #card(s) {
    const label = (text) => h("p", { class: "species-card__label" }, text);
    const stat = (name, value) => h("div", {}, h("dt", {}, name), h("dd", {}, value));
    return h("li", { class: "species-card" },
      h("div", { class: "species-card__photo" },
        h("img", {
          src: s.photo, srcset: inaturalistSrcset(s.photo), sizes: "300px",
          alt: s.displayName, loading: "lazy", decoding: "async", title: s.photoCredit,
        })),
      h("div", { class: "species-card__body" },
        h("h4", { class: "species-card__name" }, s.displayName),
        h("p", { class: "species-card__latin" }, icon("leaf"), h("i", {}, s.scientificName)),
        label("Description"),
        h("p", { class: "species-card__desc" }, NatureChapter.shorten(s.summary) || "L'une des espèces les plus observées dans le pays par les naturalistes."),
        label("Observations"),
        h("dl", { class: "species-card__stats" },
          stat("Ici", formatCompact(s.observations)),
          stat("Monde", s.worldObservations ? formatCompact(s.worldObservations) : "—"),
          stat("Rang", s.rank ? `n° ${s.rank}` : "—")),
        h("div", { class: "species-card__foot" },
          h("div", {}, label("Groupe"), h("p", { class: "species-card__big" }, s.groupLabel)),
          s.url ? h("a", {
            class: "species-card__go", href: s.url, target: "_blank", rel: "noopener noreferrer",
            "aria-label": `${s.displayName} sur iNaturalist (nouvel onglet)`, title: "Voir sur iNaturalist",
          }, icon("go")) : null)));
  }

  render(species) {
    const track = h("ul", { class: "flora__track", role: "list" });
    const groups = [...new Set(species.map((s) => s.groupLabel))];

    // La fiche la plus proche du centre devient « active » ; ses voisines « proches »
    let cards = [];
    let frame = 0;
    const centerOf = (el) => el.offsetLeft + el.offsetWidth / 2;
    const updateActive = () => {
      frame = 0;
      const middle = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      cards.forEach((card, i) => { if (Math.abs(centerOf(card) - middle) < Math.abs(centerOf(cards[best]) - middle)) best = i; });
      cards.forEach((card, i) => {
        card.classList.toggle("is-active", i === best);
        card.classList.toggle("is-near", Math.abs(i - best) === 1);
      });
      prev.disabled = best === 0;
      next.disabled = best === cards.length - 1;
      track.dataset.active = String(best);
    };
    const goTo = (i, behavior = "smooth") => {
      const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
      if (card) track.scrollTo({ left: centerOf(card) - track.clientWidth / 2, behavior });
    };
    const prev = h("button", { type: "button", class: "round-btn round-btn--light", "aria-label": "Espèce précédente", onClick: () => goTo(Number(track.dataset.active) - 1) }, icon("chevron"));
    const next = h("button", { type: "button", class: "round-btn round-btn--light round-btn--next", "aria-label": "Espèce suivante", onClick: () => goTo(Number(track.dataset.active) + 1) }, icon("chevron"));

    track.addEventListener("scroll", () => { frame ||= requestAnimationFrame(updateActive); }, { passive: true });
    // Toucher une fiche sur le côté l'amène au centre (sans suivre son lien)
    track.addEventListener("click", (event) => {
      const card = event.target.closest(".species-card");
      if (!card || card.classList.contains("is-active")) return;
      event.preventDefault();
      goTo(cards.indexOf(card));
    });
    // Au clavier : le lien d'une fiche qui reçoit le focus ramène sa fiche au centre
    track.addEventListener("focusin", (event) => {
      const card = event.target.closest(".species-card");
      if (card && !card.classList.contains("is-active")) goTo(cards.indexOf(card));
    });

    const show = (group) => {
      const list = species.filter((s) => !group || s.groupLabel === group);
      cards = list.map((s) => this.#card(s));
      track.replaceChildren(...cards);
      // On commence sur la 3ᵉ fiche : deux de chaque côté, comme un éventail
      requestAnimationFrame(() => { goTo(Math.min(2, cards.length - 1), "auto"); updateActive(); });
    };

    const filters = h("div", { class: "filters filters--dark", role: "group", "aria-label": "Filtrer par groupe" },
      [null, ...groups].map((group) => h("button", {
        type: "button", class: "filter", "aria-pressed": String(group === null),
        onClick: (event) => {
          filters.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", "false"));
          event.currentTarget.setAttribute("aria-pressed", "true");
          show(group);
        },
      }, group || "Toutes")));
    show(null);

    return [
      filters,
      h("div", { class: "flora" }, track),
      h("div", { class: "flora__footer" },
        h("div", { class: "rail__arrows" }, prev, next),
        source("Source : ", externalLink("https://www.inaturalist.org", "iNaturalist"), " · descriptions : Wikipédia · photos : leurs auteurs (licences Creative Commons, survole une photo pour voir le crédit)")),
    ];
  }
}
