// Species — une espèce animale ou végétale observée dans un pays (iNaturalist).

const GROUPS = {
  Aves: "Oiseaux",
  Mammalia: "Mammifères",
  Reptilia: "Reptiles",
  Amphibia: "Amphibiens",
  Actinopterygii: "Poissons",
  Insecta: "Insectes",
  Arachnida: "Araignées",
  Mollusca: "Mollusques",
  Plantae: "Plantes",
  Fungi: "Champignons",
};

export class Species {
  constructor({ id = null, name, scientificName, group, photo, photoCredit, observations, worldObservations = null, wikipedia, summary = null, rank = null }) {
    this.id = id;                               // identifiant iNaturalist du taxon
    this.name = name;
    this.scientificName = scientificName;
    this.group = group;
    this.photo = photo;
    this.photoCredit = photoCredit;
    this.observations = observations;           // observations dans le pays
    this.worldObservations = worldObservations; // observations dans le monde entier
    this.wikipedia = wikipedia;
    this.summary = summary;                     // résumé Wikipédia (texte brut), s'il existe
    this.rank = rank;                           // 1 = l'espèce la plus observée du pays
  }

  static get groups() {
    return GROUPS;
  }

  get groupLabel() {
    return GROUPS[this.group] || "Autres";
  }

  // La fiche de l'espèce sur iNaturalist (photos, carte des observations, description)
  get url() {
    return this.id ? `https://www.inaturalist.org/taxa/${this.id}` : this.wikipedia;
  }

  // Nom affiché : le nom français s'il existe, sinon le nom scientifique
  get displayName() {
    return this.name || this.scientificName;
  }
}
