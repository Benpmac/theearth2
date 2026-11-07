// Site — un lieu à voir : un lieu (Place) avec photo, notoriété, label UNESCO ou parc national.

import { commonsPage, commonsSrcset, commonsUrl } from "../utils/images.js";
import { Place } from "./Place.js";

export class Site extends Place {
  constructor({ id, name, lat = null, lon = null, image = null, wikipedia = null, unesco = false, park = false, popularity = 0 }) {
    super({ name, lat, lon });
    this.id = id;
    this.image = image;           // fichier Wikimedia Commons, en pleine résolution
    this.wikipedia = wikipedia;
    this.unesco = unesco;
    this.park = park;
    this.popularity = popularity; // nombre de Wikipédias qui en parlent
  }

  get hasPhoto() {
    return Boolean(this.image);
  }

  // La photo à une largeur donnée, et la liste des largeurs pour srcset
  photo(width) {
    return this.image ? commonsUrl(this.image, width) : null;
  }

  photoSrcset(widths = [500, 960, 1280]) {
    return this.image ? commonsSrcset(this.image, widths) : null;
  }

  // Où lire l'auteur et la licence de la photo
  get photoPage() {
    return this.image ? commonsPage(this.image) : null;
  }

  get kind() {
    return this.unesco ? "Patrimoine mondial" : this.park ? "Parc national" : null;
  }

  // Classement : notoriété, avec un bonus pour la photo et le label UNESCO
  get score() {
    return this.popularity + (this.hasPhoto ? 15 : 0) + (this.unesco ? 10 : 0);
  }
}
