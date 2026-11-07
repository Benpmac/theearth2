// =====================================================================
// FeedbackPage — « Ton avis » : envoyer une suggestion, un avis ou une erreur
// ---------------------------------------------------------------------
//   #/avis        le formulaire
//   #/avis/CI     le formulaire, avec le pays déjà choisi (on vient de sa page)
//
// Le parcours : on écrit → on vérifie (les erreurs s'affichent à côté du champ,
// la saisie n'est jamais effacée) → on envoie (bouton « Envoi en cours… ») →
// un message de remerciement, ou une erreur claire avec la saisie intacte.
// =====================================================================

import { Feedback } from "../models/Feedback.js";
import { FeedbackClient } from "../services/FeedbackClient.js";
import { h, icon, notice } from "../utils/dom.js";
import { SiteFooter } from "./SiteFooter.js";
import { View } from "./View.js";

// Une aide différente sous le message selon ce qu'on veut dire
const HINTS = {
  suggestion: "Décris ton idée : ce que tu aimerais trouver sur le site, et pourquoi.",
  avis: "Qu’as-tu aimé ? Qu’est-ce qui t’a manqué ou gêné ?",
  erreur: "Indique le pays et l’information concernés, et ce qui serait juste selon toi.",
};

export class FeedbackPage extends View {
  #client = new FeedbackClient();

  get documentTitle() {
    return "Ton avis · TheEarth";
  }

  // L'invitation affichée en bas de la page d'un pays : elle mène au formulaire, pays déjà choisi
  static invite(country) {
    return h("aside", { class: "feedback-cta", "aria-label": "Donner ton avis" },
      h("span", { class: "feedback-cta__icon" }, icon("chat")),
      h("p", {},
        h("strong", {}, `Une erreur, une idée pour la page ${country.name} ?`),
        h("span", {}, "Dis-le-nous en deux minutes : chaque message aide le site à grandir.")),
      h("a", { class: "btn btn--outline", href: `#/avis/${country.code}` }, "Donner mon avis"));
  }

  enter([code]) {
    const country = this.planet.country(code);
    if (!this.#client.isConfigured) console.warn("Formulaire « Ton avis » : ajoute la clé Web3Forms dans js/config.js pour recevoir les messages.");
    this.root.replaceChildren(
      h("div", { class: "feedback" }, this.#intro(), h("div", { class: "feedback__card" }, this.#form(country))),
      SiteFooter.render());
    window.scrollTo(0, 0);
  }

  leave() {
    this.root.replaceChildren();
  }

  #intro() {
    const point = (name, text) => h("li", {}, icon(name), h("span", {}, text));
    return h("header", { class: "feedback__intro" },
      h("p", { class: "feedback__eyebrow" }, "Ton avis"),
      h("h1", {}, "Aide-nous à améliorer TheEarth"),
      h("p", { class: "feedback__lead" }, "Une idée, une erreur repérée sur un pays, un coup de cœur ou une déception : écris-nous, ton message arrive directement chez l’équipe du site."),
      h("ul", { class: "feedback__points", role: "list" },
        point("compass", "Une destination, une rubrique ou une fonction qui te manque"),
        point("pin", "Une information fausse ou dépassée sur la page d’un pays"),
        point("chat", "Ce que tu as aimé… ou pas")),
      h("p", { class: "feedback__privacy" }, "Ton prénom et ton e-mail sont facultatifs : ils servent seulement à te répondre et ne sont jamais publiés."));
  }

  // --- Le formulaire -------------------------------------------------------
  #form(country) {
    const error = (name) => h("p", { class: "field__error", id: `fb-${name}-error`, hidden: true });

    // 1. Le type de message : trois pastilles (des boutons radio), « suggestion » par défaut
    const types = h("fieldset", { class: "field" },
      h("legend", { class: "field__label" }, "Ton message concerne…"),
      h("div", { class: "choices" }, Object.entries(Feedback.TYPES).map(([value, label], i) =>
        h("label", { class: "choice" }, h("input", { type: "radio", name: "type", value, checked: i === 0 }), label))));

    // 2. La note, pour un avis seulement : cinq étoiles (des boutons radio, utilisables au clavier)
    const stars = Feedback.RATINGS.map((label, i) =>
      h("label", { class: "star", title: label },
        h("input", { type: "radio", name: "rating", value: i + 1, class: "visually-hidden" }),
        icon("star"),
        h("span", { class: "visually-hidden" }, `${i + 1} sur 5 : ${label}`)));
    const starsText = h("span", { class: "stars__text", "aria-hidden": "true" });
    const rating = h("fieldset", { class: "field", hidden: true },
      h("legend", { class: "field__label" }, "Ta note ", h("span", { class: "field__optional" }, "(facultatif)")),
      h("div", { class: "stars-row" }, h("div", { class: "stars" }, stars), starsText));

    // 3. Le pays concerné : tous les pays, rangés par continent
    const place = h("div", { class: "field" },
      h("label", { class: "field__label", for: "fb-country" }, "Pays concerné ", h("span", { class: "field__optional" }, "(facultatif)")),
      h("select", { class: "input", id: "fb-country", name: "country" },
        h("option", { value: "" }, "Le site en général"),
        this.planet.byRegion().map(([region, list]) => h("optgroup", { label: region },
          list.map((c) => h("option", { value: c.code, selected: c === country }, c.name))))));

    // 4. Le message
    const hint = h("p", { class: "field__hint", id: "fb-message-hint" });
    const counter = h("span", { class: "field__counter", "aria-hidden": "true" });
    const message = h("div", { class: "field" },
      h("label", { class: "field__label", for: "fb-message" }, "Ton message"),
      hint,
      h("textarea", { class: "input", id: "fb-message", name: "message", rows: 7, maxlength: Feedback.MAX_LENGTH, required: true, "aria-describedby": "fb-message-hint fb-message-error" }),
      h("div", { class: "field__foot" }, error("message"), counter));

    // 5. Qui écrit (facultatif)
    const who = h("div", { class: "field-row" },
      h("div", { class: "field" },
        h("label", { class: "field__label", for: "fb-name" }, "Ton prénom ", h("span", { class: "field__optional" }, "(facultatif)")),
        h("input", { class: "input", id: "fb-name", name: "name", autocomplete: "given-name", maxlength: 80 })),
      h("div", { class: "field" },
        h("label", { class: "field__label", for: "fb-email" }, "Ton e-mail ", h("span", { class: "field__optional" }, "(facultatif)")),
        h("input", { class: "input", id: "fb-email", name: "email", type: "email", autocomplete: "email", maxlength: 160, "aria-describedby": "fb-email-hint fb-email-error" }),
        h("p", { class: "field__hint", id: "fb-email-hint" }, "Seulement si tu veux une réponse."),
        error("email")));

    // Piège à robots : une case invisible pour les humains. Si elle est cochée, on n'envoie rien.
    const trap = h("input", { type: "checkbox", name: "botcheck", class: "feedback__trap", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" });
    const status = h("div", { class: "feedback__status", "aria-live": "polite" });
    const submit = h("button", { type: "submit", class: "btn btn--primary" }, "Envoyer mon message", icon("arrow"));

    const form = h("form", { class: "feedback__form", novalidate: true, "aria-label": "Envoyer une suggestion ou un avis" },
      types, rating, place, message, who, trap, status,
      h("div", { class: "feedback__submit" }, submit,
        h("p", { class: "feedback__note" }, "Le message est transmis par e-mail grâce au service Web3Forms.")));

    // --- Ce qui change pendant la saisie ---
    const textarea = form.elements.message;
    const sync = () => {
      const type = form.elements.type.value;
      rating.hidden = type !== "avis";
      hint.textContent = HINTS[type];
      counter.textContent = `${textarea.value.length} / ${Feedback.MAX_LENGTH}`;
      const chosen = Number(form.elements.rating.value) || 0;
      stars.forEach((star, i) => star.classList.toggle("is-on", i < chosen));
      starsText.textContent = chosen ? Feedback.RATINGS[chosen - 1] : "";
    };
    form.addEventListener("change", sync);
    form.addEventListener("input", (event) => {
      sync();
      // Une erreur déjà affichée disparaît dès que le champ est corrigé
      const field = event.target.name;
      if (event.target.getAttribute("aria-invalid") === "true") this.#showErrors(form, this.#read(form).errors, [field]);
    });
    form.addEventListener("reset", () => setTimeout(() => { sync(); this.#showErrors(form, {}); status.replaceChildren(); }));
    form.addEventListener("submit", (event) => this.#submit(event, form, { submit, status }));
    sync();
    return form;
  }

  // Le formulaire → un objet Feedback
  #read(form) {
    const data = new FormData(form);
    return new Feedback({
      type: data.get("type"),
      rating: data.get("rating"),
      country: this.planet.country(data.get("country")),
      message: data.get("message") || "",
      name: data.get("name") || "",
      email: data.get("email") || "",
    });
  }

  // Affiche (ou efface) les erreurs à côté des champs ; `only` limite aux champs donnés
  #showErrors(form, errors, only = ["message", "email"]) {
    for (const name of only) {
      const input = form.elements[name];
      const box = form.querySelector(`#fb-${name}-error`);
      if (!input || !box) continue;
      const text = errors[name];
      input.setAttribute("aria-invalid", text ? "true" : "false");
      input.closest(".field").classList.toggle("is-invalid", Boolean(text));
      box.hidden = !text;
      box.replaceChildren(...(text ? [icon("alert"), h("span", {}, text)] : []));
    }
  }

  async #submit(event, form, { submit, status }) {
    event.preventDefault();
    if (submit.disabled) return;   // déjà en cours d'envoi
    const feedback = this.#read(form);
    this.#showErrors(form, feedback.errors);
    if (!feedback.isValid) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    if (form.elements.botcheck.checked) return this.#thanks(form, feedback);   // un robot : on fait comme si

    const label = submit.firstChild.textContent;
    submit.disabled = true;
    submit.firstChild.textContent = "Envoi en cours…";
    form.setAttribute("aria-busy", "true");
    status.replaceChildren();
    const signal = this.signal;   // passe à « aborted » si l'on quitte la page pendant l'envoi
    try {
      await this.#client.send(feedback);
      if (!signal?.aborted) this.#thanks(form, feedback);
    } catch (error) {
      console.warn(error);
      // Sans clé, réessayer ne servirait à rien : le message s'adresse alors au propriétaire du site
      const retry = this.#client.isConfigured ? " Ton message est toujours là : réessaie dans un instant." : "";
      status.replaceChildren(notice(`${error.message}${retry}`, { error: true }));
    } finally {
      submit.disabled = false;
      submit.firstChild.textContent = label;
      form.removeAttribute("aria-busy");
    }
  }

  // Le message est parti : un remerciement, et la suite du voyage
  #thanks(form, feedback) {
    const back = feedback.country
      ? h("a", { class: "btn btn--primary", href: `#/pays/${feedback.country.code}` }, `Revenir à la page ${feedback.country.name}`)
      : h("a", { class: "btn btn--primary", href: "#/" }, "Continuer la visite");
    const panel = h("div", { class: "feedback__done", tabindex: "-1", role: "status" },
      h("span", { class: "feedback__done-icon" }, icon("check")),
      h("h2", {}, "Merci, ton message est bien parti !"),
      h("p", {}, feedback.email
        ? `Il est arrivé chez l’équipe de TheEarth. Si elle a besoin de précisions, elle pourra te répondre à ${feedback.email}.`
        : "Il est arrivé chez l’équipe de TheEarth. Merci de prendre le temps d’aider le site à grandir."),
      h("div", { class: "feedback__actions" }, back,
        h("button", { type: "button", class: "btn btn--outline", onClick: () => {
          form.reset();
          panel.replaceWith(form);
          form.elements.message.focus();
        } }, "Écrire un autre message")));
    form.replaceWith(panel);
    panel.focus();
  }
}
