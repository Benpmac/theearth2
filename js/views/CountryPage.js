// =====================================================================
// CountryPage — "visiter un pays depuis son canapé"
// ---------------------------------------------------------------------
// Une page complète, aux couleurs des 4 palettes, organisée comme un voyage
// en 4 étapes : Découvrir, À voir, Préparer, Sur place. Chaque étape
// regroupe des chapitres (classes héritant de Chapter), chargés
// seulement quand on approche en faisant défiler la page.
// =====================================================================

import { formatLocalTime } from "../utils/format.js";
import { externalLink, h, icon } from "../utils/dom.js";
import { commonsPage, commonsSrcset, commonsUrl } from "../utils/images.js";
import { describeWeather } from "../utils/weather-codes.js";
import { FeedbackPage } from "./FeedbackPage.js";
import { HeroSlideshow } from "./HeroSlideshow.js";
import { SiteFooter } from "./SiteFooter.js";
import { View } from "./View.js";
import { EssentialsChapter, WelcomeChapter } from "./chapters/discover.js";
import { LandscapesChapter, NatureChapter } from "./chapters/see.js";
import { HolidaysChapter, PracticalChapter, WhenToGoChapter } from "./chapters/prepare.js";
import { BeforeYouGoChapter, OnSiteChapter } from "./chapters/guide.js";
import { FoodChapter } from "./chapters/onsite.js";

export class CountryPage extends View {
  // L'itinéraire de la visite : modifier cette liste suffit à réorganiser la page
  static GROUPS = [
    { id: "decouvrir", label: "Découvrir", intro: "Le pays en un coup d'œil.", chapters: [WelcomeChapter, EssentialsChapter] },
    { id: "voir", label: "À voir", intro: "Les plus beaux paysages du pays, puis la faune et la flore que l'on y croise.", chapters: [LandscapesChapter, NatureChapter] },
    { id: "preparer", label: "Préparer", intro: "Quand partir et ce qu'il faut savoir avant le départ.", chapters: [WhenToGoChapter, PracticalChapter, HolidaysChapter, BeforeYouGoChapter] },
    { id: "sur-place", label: "Sur place", intro: "Manger, se déplacer, se comporter comme il faut.", chapters: [FoodChapter, OnSiteChapter] },
  ];

  #chapters = [];
  #lazyObserver = null;
  #navObserver = null;
  country = null;

  get documentTitle() {
    return this.country ? `${this.country.name} · TheEarth` : "Pays introuvable · TheEarth";
  }

  enter([code]) {
    const country = this.planet.country(code);
    this.country = country;
    this.#chapters = [];

    if (!country) {
      this.root.replaceChildren(h("div", { class: "page-message" },
        h("h1", {}, "Pays introuvable"),
        h("p", {}, `Le code « ${code || ""} » ne correspond à aucun pays. Cherche-le par son nom en haut de la page, ou parcours toutes les destinations.`),
        h("a", { class: "btn btn--primary", href: "#/" }, "Voir toutes les destinations")));
      return;
    }

    const nav = this.#nav();
    const groups = CountryPage.GROUPS.map((group, i) => this.#group(group, i));
    // La barre des étapes et les étapes sont dans le même bloc : la barre reste collée en haut
    // de l'écran pendant tout le contenu du pays, puis s'en va avant le pied de page
    this.root.replaceChildren(this.#hero(country), h("div", { class: "country__main" }, nav, h("div", { class: "country__body" }, groups)), FeedbackPage.invite(country), SiteFooter.render());

    // Chargement paresseux : un chapitre se charge à ~800 px de l'écran
    this.#lazyObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const chapter = this.#chapters.find((c) => c.el === entry.target);
        chapter?.run();
        this.#lazyObserver.unobserve(entry.target);
      }
    }, { rootMargin: "800px 0px" });
    this.#chapters.forEach((c) => this.#lazyObserver.observe(c.el));

    // Navigation : l'étape visible est mise en évidence
    this.#navObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        nav.querySelectorAll("button").forEach((b) => b.removeAttribute("aria-current"));
        if (entry.target.classList.contains("hero")) continue;   // en haut de page : aucune étape en cours
        const active = nav.querySelector(`[data-target="${entry.target.id}"]`);
        active?.setAttribute("aria-current", "step");
        // Sur petit écran, la barre défile horizontalement : on y centre l'étape active
        // (on fait défiler la barre seule, pour ne pas interrompre le défilement de la page)
        const list = nav.querySelector(".country-nav__list");
        if (active && list.scrollWidth > list.clientWidth) {
          const item = active.parentElement;
          list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2, behavior: "smooth" });
        }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    groups.forEach((g) => this.#navObserver.observe(g));
    this.#navObserver.observe(this.root.querySelector(".hero"));

    window.scrollTo(0, 0);
    requestAnimationFrame(() => this.root.querySelector(".hero__name")?.focus({ preventScroll: true }));
  }

  leave() {
    this.#lazyObserver?.disconnect();
    this.#navObserver?.disconnect();
    this.root.replaceChildren();
    this.country = null;
  }

  // ------------------------------------------------------------------
  // En-tête : grande photo nette, drapeau, nom, heure et météo du moment
  // ------------------------------------------------------------------
  #hero(c) {
    const media = h("div", { class: "hero__media" });
    const credit = h("p", { class: "hero__credit", hidden: true });
    const timeChip = h("li", { class: "hero__chip", hidden: true });
    const weatherChip = h("li", { class: "hero__chip", hidden: true });
    const signal = this.signal;   // le signal de cette visite (il change si l'on part vers un autre pays)

    // Plusieurs photos du pays, en haute définition (le navigateur choisit parmi 960 à 3840 px
    // selon l'écran) : la photo de couverture d'abord, puis 4 photos des Paysages, en fondu
    // enchaîné (HeroSlideshow). En attendant (ou sans photo), la carte ancienne sous un voile.
    const slideshow = new HeroSlideshow({ media, credit, signal });
    const HD = [960, 1280, 1920, 3840];
    c.coverPhoto().then((photo) => photo && slideshow.add([photo.local
      ? { src: photo.src, title: photo.title }
      : { src: commonsUrl(photo.file, 1920), srcset: commonsSrcset(photo.file, HD), title: photo.title, page: commonsPage(photo.file) }]))
      .catch(() => {});
    c.landscapes().then((sites) => slideshow.add(sites.slice(0, 4).map((s) => ({
      src: s.photo(1920), srcset: s.photoSrcset(HD), title: s.name, page: s.photoPage,
    })))).catch(() => {});

    c.weather().then((w) => {
      if (signal?.aborted) return;
      timeChip.replaceChildren(icon("clock"), `${formatLocalTime(w.utc_offset_seconds)} heure locale`);
      const now = describeWeather(w.current.weather_code, w.current.is_day === 1);
      weatherChip.replaceChildren(icon(now.icon), `${Math.round(w.current.temperature_2m)} °C, ${now.label.toLowerCase()}`);
      timeChip.hidden = false;
      weatherChip.hidden = false;
    }).catch(() => {});

    const jump = (id, label, className) => h("button", { class: `btn ${className}`, type: "button", onClick: () => this.#scrollTo(id) }, label);

    // Le nom du pays en très grand, en capitales, sur la photo. Sa taille suit sa longueur
    // (--len) : « Japon » remplit la bannière, « Saint-Vincent-et-les-Grenadines » tient aussi.
    const longestWord = Math.max(...c.name.split(/[\s-]+/).map((w) => w.length));
    return h("header", { class: "hero" },
      media,
      h("div", { class: "hero__top" },
        h("nav", { class: "breadcrumb", "aria-label": "Fil d'Ariane" },
          h("ol", {}, h("li", {}, h("a", { href: "#/" }, "Destinations")), h("li", {}, h("a", { href: `#/destinations/${encodeURIComponent(c.region)}` }, c.region)), h("li", { "aria-current": "page" }, c.name))),
        h("ul", { class: "hero__chips", role: "list" },
          c.capitalNames.length ? h("li", { class: "hero__chip" }, icon("pin"), c.capitalNames.join(", ")) : null,
          timeChip, weatherChip)),
      h("div", { class: "hero__inner" },
        h("div", { class: "hero__title", style: { "--len": Math.max(longestWord, Math.ceil(c.name.length / 2)) } },
          h("h1", { class: "hero__name", tabindex: "-1" }, c.name),
          h("span", { class: "hero__code", "aria-hidden": "true" }, c.code)),
        h("p", { class: "hero__tagline" },
          h("img", { class: "hero__flag", src: c.flag, alt: `Drapeau : ${c.name}`, width: 36, height: 27 }),
          h("span", {}, [c.officialName !== c.name ? c.officialName : null, c.subregion || c.region].filter(Boolean).join(" · "))),
        h("div", { class: "hero__actions" },
          jump("g-decouvrir", "Découvrir le pays", "btn--light"),
          jump("g-preparer", "Préparer le voyage", "btn--outline-light"))),
      h("div", { class: "hero__foot" }, slideshow.controls, credit));
  }

  // ------------------------------------------------------------------
  // Barre des étapes (collante en haut de l'écran)
  // ------------------------------------------------------------------
  #nav() {
    return h("nav", { class: "country-nav", "aria-label": "Étapes de la visite" },
      h("ol", { class: "country-nav__list" }, CountryPage.GROUPS.map((g, i) =>
        h("li", {}, h("button", { type: "button", "data-target": `g-${g.id}`, onClick: () => this.#scrollTo(`g-${g.id}`) },
          h("span", { class: "country-nav__index", "aria-hidden": "true" }, String(i + 1)), g.label)))));
  }

  #group(group, index) {
    const section = h("section", { class: `group group--${group.id}`, id: `g-${group.id}`, "aria-labelledby": `g-${group.id}-title` },
      h("header", { class: "group__head" },
        h("p", { class: "group__index" }, `Étape ${index + 1} sur ${CountryPage.GROUPS.length}`),
        h("h2", { class: "group__title", id: `g-${group.id}-title` }, group.label),
        h("p", { class: "group__intro" }, group.intro)));
    for (const ChapterClass of group.chapters) {
      if (ChapterClass.isAvailableFor && !ChapterClass.isAvailableFor(this.country)) continue;
      const chapter = new ChapterClass(this.country, this);   // polymorphisme : chaque classe sait se charger et s'afficher
      chapter.mount(section);
      this.#chapters.push(chapter);
    }
    return section;
  }

  #scrollTo(id) {
    const target = this.root.querySelector(`#${id}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    const chapter = this.#chapters.find((c) => c.el === target);
    chapter?.run();
  }
}
