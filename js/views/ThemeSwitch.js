// =====================================================================
// ThemeSwitch — le bouton soleil / lune de la barre du haut
// ---------------------------------------------------------------------
// Le site est en mode SOMBRE par défaut, quel que soit le réglage de
// l'appareil. Le bouton passe en clair (et inversement) ; le choix est
// retenu pour les prochaines visites (localStorage). Le petit script en
// tête de index.html applique ce choix avant le premier affichage, pour
// éviter un éclair de la mauvaise couleur au chargement.
//
// Côté CSS, tout repose sur un attribut : <html data-theme="light">.
// Sans lui, ce sont les rôles sombres de css/tokens.css qui s'appliquent.
//
//   ThemeSwitch.current   "dark" ou "light"
//   ThemeSwitch.isDark    true / false
//   ThemeSwitch.set(t)    change de mode et prévient la page (événement "themechange")
// =====================================================================

import { icon } from "../utils/dom.js";

export class ThemeSwitch {
  static KEY = "theme";
  static EVENT = "themechange";

  static get current() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  static get isDark() {
    return ThemeSwitch.current === "dark";
  }

  static set(theme) {
    const light = theme === "light";
    const root = document.documentElement;
    if (light) root.dataset.theme = "light";
    else delete root.dataset.theme;
    // Barres de défilement, champs et fond initial du navigateur suivent le mode
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", light ? "light" : "dark");
    try {
      if (light) localStorage.setItem(ThemeSwitch.KEY, "light");
      else localStorage.removeItem(ThemeSwitch.KEY);   // sombre = le défaut, rien à retenir
    } catch {
      // Navigation privée ou stockage bloqué : le choix vaut pour cette visite seulement
    }
    window.dispatchEvent(new CustomEvent(ThemeSwitch.EVENT, { detail: { theme: light ? "light" : "dark" } }));
  }

  #button;

  constructor(button) {
    this.#button = button;
    button.addEventListener("click", () => ThemeSwitch.set(ThemeSwitch.isDark ? "light" : "dark"));
    window.addEventListener(ThemeSwitch.EVENT, () => this.#render());
    this.#render();
  }

  // L'icône montre le mode vers lequel on passe (soleil = aller vers le clair)
  #render() {
    const dark = ThemeSwitch.isDark;
    const label = dark ? "Passer en mode clair" : "Passer en mode sombre";
    this.#button.setAttribute("aria-label", label);
    this.#button.title = label;
    this.#button.replaceChildren(icon(dark ? "sun" : "moon"));
  }
}
