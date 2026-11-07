// =====================================================================
// config.js — réglages et adresses de tous les services extérieurs
// ---------------------------------------------------------------------
// Aucun autre fichier ne contient d'URL d'API : pour changer de
// fournisseur, c'est ici et seulement ici.
//
// Le site ne garde que ce qui sert à découvrir et visiter un pays :
// textes, photos, sites à voir, carte, météo, infos pratiques, guide.
// =====================================================================

export const API = {
  wikipedia: "https://fr.wikipedia.org/w/api.php",           // présentation du pays
  wikipediaEn: "https://en.wikipedia.org/w/api.php",         // photos des lieux emblématiques (bannière des pays)
  wikivoyage: "https://fr.wikivoyage.org/w/api.php",         // guide du voyageur
  wikidata: "https://query.wikidata.org/sparql",             // sites à voir, photos, infos pratiques
  forecast: "https://api.open-meteo.com/v1/forecast",        // météo des 7 prochains jours
  archive: "https://archive-api.open-meteo.com/v1/archive",  // climat de l'année passée (quand partir)
  exchange: "https://open.er-api.com/v6/latest/EUR",         // taux de change
  inaturalist: "https://api.inaturalist.org/v1",             // faune et flore à observer
  feedback: "https://api.web3forms.com/submit",              // formulaire « Ton avis » → e-mail
};

// Le formulaire « Ton avis » (#/avis) : les messages arrivent par e-mail grâce à Web3Forms
// (gratuit, 250 messages par mois). Pour le relier à ta boîte :
//   1. va sur https://web3forms.com et entre ton adresse e-mail ;
//   2. tu reçois une clé d'accès (access key) par e-mail : colle-la ci-dessous.
// Cette clé est faite pour être publique : elle permet seulement d'envoyer un message
// vers ta boîte, pas de lire tes e-mails ni de modifier ton compte.
export const FEEDBACK = {
  accessKey: "",
};

// Le pied de page : ceux qui ont fait le site. Ajoute une ligne par personne
// (nom, rôle) ; les bénévoles et photographes des sources sont cités automatiquement.
export const CREDITS = {
  people: [
    { name: "Pierre-Marie Cédric Benson", role: "Conception et développement" },
  ],
};

// Fichiers locaux préparés par outils/build-data.js
export const DATA = {
  countries: "data/countries.json",
  cities: "data/cities.json",
  holidays: (code) => `data/pays/${code}.json`,
  flag: (code) => `data/drapeaux/${code.toLowerCase()}.svg`,
  landmarks: "data/lieux-couverture.json",   // 2 ou 3 lieux emblématiques par pays, pour la bannière
};

// Photos de bannière fournies avec le site (img/pays/), prioritaires sur celles
// trouvées en ligne. Pour mettre ta propre photo sur un pays : ajoute le fichier
// dans img/pays/ et une ligne ici (code ISO à 2 lettres du pays).
export const LOCAL_COVERS = {
  AU: { src: "img/pays/au.jpg", title: "Sydney, l’opéra et le Harbour Bridge" },
};

// Largeurs d'images autorisées par Wikimedia : depuis 2026, les autres tailles
// sont limitées (erreur 429, image cassée). Toujours choisir dans cette liste.
export const COMMONS_WIDTHS = [120, 250, 330, 500, 960, 1280, 1920, 3840];

export const SETTINGS = {
  requestTimeout: 20000,     // une requête est abandonnée après 20 s
  sparqlTimeout: 45000,      // Wikidata peut être lent sur les grosses requêtes (limite serveur : 60 s)
  maxSites: 18,
  maxSpecies: 24,
  autoRotateSpeed: 0.0036,   // degrés par milliseconde (3,6° par seconde)
  minZoom: 0.8,
  maxZoom: 12,
};
