// =====================================================================
// images.js — des photos nettes, sans gaspiller la connexion
// ---------------------------------------------------------------------
// Une photo floue vient presque toujours d'une image trop petite étirée
// à l'écran. La parade : proposer au navigateur PLUSIEURS largeurs
// (attribut srcset) et lui dire quelle place l'image occupera (sizes).
// Il choisit alors la plus petite image qui reste nette, en tenant
// compte de la densité de l'écran (×2 sur un téléphone récent).
//
// Wikimedia Commons fabrique ces versions à la demande, mais seulement
// aux largeurs standard (COMMONS_WIDTHS) : les autres sont limitées.
// =====================================================================

import { COMMONS_WIDTHS } from "../config.js";

// Une adresse Commons (…/Special:FilePath/Nom.jpg) à une largeur standard
export function commonsUrl(file, width = null) {
  const https = file.replace(/^http:/, "https:");
  if (!width) return https;
  const standard = COMMONS_WIDTHS.find((w) => w >= width) || COMMONS_WIDTHS.at(-1);
  return `${https}?width=${standard}`;
}

// "…/Special:FilePath/A.jpg?width=500 500w, …?width=960 960w, …"
export function commonsSrcset(file, widths) {
  return widths.map((w) => `${commonsUrl(file, w)} ${w}w`).join(", ");
}

// La page de description du fichier (auteur, licence) : à citer sous une photo
export function commonsPage(file) {
  const name = decodeURIComponent(file.split("Special:FilePath/")[1] || "");
  return name ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name.replace(/ /g, "_"))}` : "https://commons.wikimedia.org";
}

// Le nom du fichier, écrit toujours de la même façon (espaces → _, minuscules) :
// sert à reconnaître la même photo, qu'elle vienne de Wikidata ou de Wikipédia
export function commonsFileName(file) {
  const name = (file || "").split("Special:FilePath/")[1] || "";
  try {
    return decodeURIComponent(name).replace(/ /g, "_").toLowerCase();
  } catch {
    return name.toLowerCase();
  }
}

// Les adresses Commons venues de Wikidata sont "Special:FilePath/…" ;
// on reconnaît les drapeaux, cartes et blasons, qui ne sont pas des photos de voyage
const NOT_A_PHOTO = /flag|drapeau|coat[_ %20]of[_ %20]arms|armoiries|emblem|blason|seal|location|localisation|locator|carte|map|orthographic|relief|topograph|satellite|nasa|blue[_ %20]marble|globe|\.svg|\.png|\.gif|\.tif/i;

export function isTravelPhoto(file) {
  return Boolean(file) && !NOT_A_PHOTO.test(decodeURIComponent(file));
}

// iNaturalist : …/medium.jpg (500 px) et …/large.jpg (1024 px)
export function inaturalistSrcset(mediumUrl) {
  if (!/\/medium\.(jpe?g|png)/i.test(mediumUrl)) return null;
  return `${mediumUrl} 500w, ${mediumUrl.replace(/\/medium\./i, "/large.")} 1024w`;
}
