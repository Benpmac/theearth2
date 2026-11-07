// =====================================================================
// View — la classe mère des écrans (pays, destinations)
// ---------------------------------------------------------------------
// Chaque écran correspond à un élément <section data-page="…"> de
// index.html. La vue est "entrée" quand son écran s'affiche (enter) et
// "quittée" quand on part (leave). Les sous-classes redéfinissent ces
// deux méthodes : c'est le polymorphisme.
// =====================================================================

export class View {
  #controller = null;

  constructor(root, app) {
    this.root = root;   // l'élément HTML de l'écran
    this.app = app;     // accès à la planète, au routeur, aux autres vues
  }

  get planet() {
    return this.app.planet;
  }

  // Un signal qui passe à "aborted" quand on quitte l'écran :
  // les chargements en cours savent alors qu'ils ne doivent plus rien afficher.
  get signal() {
    return this.#controller?.signal;
  }

  // Appelée par App ; ne pas redéfinir (redéfinir enter/leave à la place)
  show(params) {
    const active = Boolean(this.#controller);
    this.#controller?.abort();
    // Déjà affiché (ex. on passe d'un pays à un autre) : on range d'abord l'ancien contenu
    // (observateurs, carte, minuteries…) avant de construire le nouveau
    if (active) this.leave();
    this.#controller = new AbortController();
    this.root.hidden = false;
    this.enter(params);
  }

  hide() {
    if (!this.#controller) return;
    this.#controller.abort();
    this.#controller = null;
    this.root.hidden = true;
    this.leave();
  }

  // À redéfinir dans les sous-classes
  enter(_params) {}
  leave() {}

  // Titre de l'onglet du navigateur pour cet écran
  get documentTitle() {
    return "TheEarth";
  }
}
