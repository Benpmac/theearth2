// =====================================================================
// HeroSlideshow — plusieurs photos du pays dans la bannière
// ---------------------------------------------------------------------
// Les photos se succèdent en fondu enchaîné toutes les 7 secondes :
// la photo de couverture d'abord, puis celles des Paysages.
//   • Une photo n'est téléchargée qu'au moment d'être montrée (et la
//     suivante juste avant, pour que le fondu soit net) : pas de gaspillage.
//   • Un bouton met le diaporama en pause (règle WCAG 2.2.2 : ce qui bouge
//     plus de 5 secondes doit pouvoir être arrêté) ; des points mènent à
//     une photo précise. Si le visiteur a demandé moins d'animations
//     (prefers-reduced-motion), le diaporama démarre en pause.
//   • Il s'arrête quand la bannière sort de l'écran ou que l'onglet est caché.
// =====================================================================

import { externalLink, h, icon } from "../utils/dom.js";

export class HeroSlideshow {
  static DELAY = 7000;

  #slides = [];        // { src, srcset, title, page, img }
  #index = -1;         // la photo affichée
  #wanted = -1;        // la photo demandée (elle peut être en train de se charger)
  #timer = 0;
  #paused;
  #visible = true;
  #signal;

  constructor({ media, credit, signal }) {
    this.media = media;
    this.credit = credit;
    this.#signal = signal;
    this.#paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.dots = h("div", { class: "hero__dots" });
    this.toggle = h("button", { type: "button", class: "hero__play", onClick: () => this.#setPaused(!this.#paused) });
    this.controls = h("div", { class: "hero__slides", role: "group", "aria-label": "Photos du pays", hidden: true }, this.toggle, this.dots);
    this.#updateToggle();

    const observer = new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting;
      this.#schedule();
    });
    observer.observe(media);
    signal?.addEventListener("abort", () => {
      clearTimeout(this.#timer);
      observer.disconnect();
    });
  }

  // Ajoute des photos [{ src, srcset, title, page }] ; la toute première s'affiche aussitôt
  add(photos) {
    if (this.#signal?.aborted) return;
    for (const photo of photos) {
      if (photo && !this.#slides.some((s) => s.src === photo.src)) this.#slides.push({ ...photo, img: null });
    }
    this.#renderDots();
    if (this.#wanted < 0 && this.#slides.length) this.show(0);
    else this.#schedule();
  }

  show(index) {
    const count = this.#slides.length;
    if (!count) return;
    const i = (index + count) % count;
    this.#wanted = i;
    clearTimeout(this.#timer);
    const img = this.#image(this.#slides[i], i === 0);
    if (img.complete && img.naturalWidth) this.#activate(i);
    else img.addEventListener("load", () => this.#activate(i), { once: true });
  }

  // L'élément <img> d'une photo, créé (donc téléchargé) seulement quand on en a besoin
  #image(slide, first) {
    slide.img ??= h("img", {
      src: slide.src,
      srcset: slide.srcset || null,
      sizes: slide.srcset ? "100vw" : null,
      alt: "",
      decoding: "async",
      fetchpriority: first ? "high" : null,
      onError: () => this.#drop(slide),
    });
    if (!slide.img.isConnected) this.media.append(slide.img);
    return slide.img;
  }

  #activate(i) {
    if (i !== this.#wanted || this.#signal?.aborted) return;
    this.#index = i;
    const slide = this.#slides[i];
    this.#slides.forEach((s) => s.img?.classList.toggle("is-active", s === slide));
    this.credit.hidden = false;
    this.credit.replaceChildren(h("span", {}, "Photo : ", slide.title, slide.page ? [" · ", externalLink(slide.page, "Wikimedia Commons")] : null));
    [...this.dots.children].forEach((dot, n) => dot.toggleAttribute("aria-current", n === i));
    // La suivante se télécharge pendant qu'on regarde celle-ci
    const next = this.#slides[(i + 1) % this.#slides.length];
    if (next !== slide) this.#image(next, false);
    this.#schedule();
  }

  // Une photo qui ne se charge pas est retirée du diaporama
  #drop(slide) {
    const position = this.#slides.indexOf(slide);
    if (position < 0) return;
    slide.img?.remove();
    this.#slides.splice(position, 1);
    this.#renderDots();
    if (position === this.#wanted) {
      this.#wanted = -1;
      this.show(position);
    } else if (position < this.#index) {
      this.#index -= 1;
      this.#wanted = this.#index;
    }
  }

  #renderDots() {
    this.controls.hidden = this.#slides.length < 2;
    this.dots.replaceChildren(...this.#slides.map((slide, n) => h("button", {
      type: "button",
      class: "hero__dot",
      "aria-label": `Photo ${n + 1} : ${slide.title}`,
      "aria-current": n === this.#index ? "true" : null,
      onClick: () => this.show(n),
    })));
  }

  #schedule() {
    clearTimeout(this.#timer);
    if (this.#paused || !this.#visible || this.#slides.length < 2 || this.#index < 0 || this.#signal?.aborted) return;
    this.#timer = setTimeout(() => (document.hidden ? this.#schedule() : this.show(this.#index + 1)), HeroSlideshow.DELAY);
  }

  #setPaused(paused) {
    this.#paused = paused;
    this.#updateToggle();
    this.#schedule();
  }

  #updateToggle() {
    this.toggle.replaceChildren(icon(this.#paused ? "play" : "pause"));
    this.toggle.setAttribute("aria-label", this.#paused ? "Lancer le diaporama" : "Mettre le diaporama en pause");
  }
}
