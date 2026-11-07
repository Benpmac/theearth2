// =====================================================================
// PhotoViewer — une photo en grand, sur fond de nuit (chapitre « Paysages »)
// ---------------------------------------------------------------------
//   const viewer = new PhotoViewer([{ src, srcset, title, kind, credit, article }, …]);
//   viewer.open(2);    // ouvre la 3ᵉ photo
//
// Un <dialog> natif : le navigateur garde le focus à l'intérieur, et Échap
// le ferme. Flèches ← → (ou boutons) pour passer d'une photo à l'autre.
// Chaque photo cite son auteur et sa licence (page Wikimedia Commons).
// =====================================================================

import { externalLink, h, icon } from "../utils/dom.js";

export class PhotoViewer {
  #photos;
  #index = 0;
  #dialog = null;
  #opener = null;

  constructor(photos) {
    this.#photos = photos;
  }

  open(index = 0) {
    this.#opener = document.activeElement;
    this.#dialog ??= this.#build();
    document.body.append(this.#dialog);
    document.documentElement.classList.add("has-viewer");   // la page derrière ne défile plus
    this.#show(index);
    this.#dialog.showModal();
    // Les flèches sont écoutées sur tout le document : quand la légende change, le lien
    // qui avait le focus disparaît, et le focus repart sur la page
    document.addEventListener("keydown", this.#onKey);
    // Si l'adresse change (bouton Précédent du navigateur), on referme
    window.addEventListener("hashchange", this.#closeOnLeave, { once: true });
  }

  close() {
    this.#dialog?.close();
  }

  #closeOnLeave = () => this.close();

  #onKey = (event) => {
    if (event.key === "ArrowLeft") this.#show(this.#index - 1);
    if (event.key === "ArrowRight") this.#show(this.#index + 1);
  };

  #build() {
    this.img = h("img", { class: "viewer__img", alt: "", sizes: "100vw", decoding: "async" });
    this.caption = h("figcaption", { class: "viewer__caption" });
    this.counter = h("p", { class: "viewer__counter", "aria-live": "polite" });
    const several = this.#photos.length > 1;
    const dialog = h("dialog", { class: "viewer", "aria-label": "Photo en grand" },
      h("figure", { class: "viewer__figure" }, this.img, this.caption),
      // autofocus : à l'ouverture, le focus va sur « Fermer » (et non sur un lien de la légende)
      h("button", { type: "button", class: "round-btn round-btn--light viewer__close", "aria-label": "Fermer", autofocus: true, onClick: () => this.close() }, icon("close")),
      several ? h("button", { type: "button", class: "round-btn round-btn--light viewer__prev", "aria-label": "Photo précédente", onClick: () => this.#show(this.#index - 1) }, icon("chevron")) : null,
      several ? h("button", { type: "button", class: "round-btn round-btn--light round-btn--next viewer__next", "aria-label": "Photo suivante", onClick: () => this.#show(this.#index + 1) }, icon("chevron")) : null,
      several ? this.counter : null);

    // Un clic à côté de la photo (sur le fond) ferme la visionneuse
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.classList.contains("viewer__figure")) this.close();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("has-viewer");
      document.removeEventListener("keydown", this.#onKey);
      window.removeEventListener("hashchange", this.#closeOnLeave);
      dialog.remove();
      this.#opener?.focus?.({ preventScroll: true });
    });
    return dialog;
  }

  // Affiche la photo n° index (on boucle : après la dernière, la première)
  #show(index) {
    const count = this.#photos.length;
    this.#index = (index + count) % count;
    const photo = this.#photos[this.#index];
    this.img.classList.remove("is-loaded");
    this.img.onload = () => this.img.classList.add("is-loaded");
    this.img.srcset = photo.srcset || "";
    this.img.src = photo.src;
    this.img.alt = photo.title;
    // replaceChildren écrirait « null » en toutes lettres : on retire d'abord les absents
    this.caption.replaceChildren(...[
      photo.kind ? h("small", {}, photo.kind) : null,
      h("strong", {}, photo.title),
      h("span", { class: "viewer__links" },
        photo.credit ? externalLink(photo.credit, "Auteur et licence de la photo") : null,
        photo.article ? externalLink(photo.article, "Lire sur Wikipédia") : null),
    ].filter(Boolean));
    this.counter.textContent = `${this.#index + 1} / ${count}`;
  }
}
