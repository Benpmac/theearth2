// =====================================================================
// SearchBox — champ de recherche de pays avec suggestions
// ---------------------------------------------------------------------
// Un composant réutilisable (une classe, autant d'instances qu'on veut) ;
// le site en crée un dans la barre du haut. Il suit le modèle "combobox" (WAI-ARIA) :
// flèches pour parcourir, Entrée pour choisir, Échap pour fermer.
// =====================================================================

import { h, icon } from "../utils/dom.js";

let instances = 0;

export class SearchBox {
  #planet; #input; #list; #results = []; #active = -1; #id;

  constructor(root, planet, { onSelect, label = "Chercher un pays", placeholder = "Chercher un pays…", clearOnSelect = true } = {}) {
    this.#planet = planet;
    this.onSelect = onSelect;
    this.clearOnSelect = clearOnSelect;
    this.#id = `searchbox-${++instances}`;

    this.#input = h("input", {
      class: "searchbox__input",
      id: `${this.#id}-input`,
      type: "text",
      autocomplete: "off",
      spellcheck: "false",
      placeholder,
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": "false",
      "aria-controls": `${this.#id}-list`,
    });
    this.#list = h("ul", { class: "searchbox__list", id: `${this.#id}-list`, role: "listbox", hidden: true });

    root.classList.add("searchbox");
    root.replaceChildren(
      h("label", { class: "searchbox__label", for: `${this.#id}-input` }, label),
      h("div", { class: "searchbox__field" }, icon("search", "icon searchbox__icon"), this.#input),
      this.#list
    );

    this.#input.addEventListener("input", () => this.#update());
    this.#input.addEventListener("keydown", (event) => this.#onKey(event));
    this.#input.addEventListener("blur", () => this.close());
  }

  get input() {
    return this.#input;
  }

  set value(text) {
    this.#input.value = text;
  }

  focus() {
    this.#input.focus();
  }

  close() {
    this.#list.hidden = true;
    this.#input.setAttribute("aria-expanded", "false");
    this.#input.removeAttribute("aria-activedescendant");
    this.#active = -1;
  }

  #update() {
    this.#results = this.#planet.search(this.#input.value);
    this.#active = this.#results.length ? 0 : -1;
    this.#render();
  }

  #render() {
    if (!this.#input.value.trim()) return this.close();
    this.#list.replaceChildren(
      ...(this.#results.length
        ? this.#results.map((country, i) =>
            h(
              "li",
              {
                class: "searchbox__option",
                id: `${this.#id}-opt-${i}`,
                role: "option",
                "aria-selected": String(i === this.#active),
                onMousedown: (event) => {
                  event.preventDefault();   // le choix est pris avant que le champ perde le focus
                  this.#choose(country);
                },
              },
              h("img", { src: country.flag, alt: "", width: 28, height: 21, loading: "lazy" }),
              h("span", { class: "searchbox__name" }, country.name),
              h("span", { class: "searchbox__region" }, country.region)
            )
          )
        : [h("li", { class: "searchbox__empty", role: "option", "aria-disabled": "true" }, "Aucun pays ne correspond. Essaie un autre nom ou la capitale.")])
    );
    if (this.#active >= 0) this.#input.setAttribute("aria-activedescendant", `${this.#id}-opt-${this.#active}`);
    this.#list.hidden = false;
    this.#input.setAttribute("aria-expanded", "true");
  }

  #onKey(event) {
    const n = this.#results.length;
    if (event.key === "ArrowDown" && n) {
      event.preventDefault();
      this.#active = (this.#active + 1) % n;
      this.#render();
    } else if (event.key === "ArrowUp" && n) {
      event.preventDefault();
      this.#active = (this.#active - 1 + n) % n;
      this.#render();
    } else if (event.key === "Enter" && this.#results[this.#active]) {
      event.preventDefault();
      this.#choose(this.#results[this.#active]);
    } else if (event.key === "Escape") {
      this.#input.value = "";
      this.close();
    }
  }

  #choose(country) {
    this.#input.value = this.clearOnSelect ? "" : country.name;
    this.close();
    if (this.clearOnSelect) this.#input.blur();
    this.onSelect(country);
  }
}
