// =====================================================================
// services/index.js — crée une instance de chaque service, une seule fois
// ---------------------------------------------------------------------
// Ces instances sont ensuite "injectées" dans la planète et ses pays
// (injection de dépendances) : les classes du modèle ne savent pas
// d'où viennent les données, elles demandent simplement au service.
// Pour tester ou changer de fournisseur, on remplace un service ici.
// =====================================================================

import { WikidataClient } from "./WikidataClient.js";
import { LandmarkPhotoClient, WikipediaClient, WikivoyageClient } from "./MediaWikiClients.js";
import { OpenMeteoClient } from "./OpenMeteoClient.js";
import { ExchangeClient, INaturalistClient } from "./OtherClients.js";

export function createServices() {
  return {
    wikidata: new WikidataClient(),
    wikipedia: new WikipediaClient(),
    wikivoyage: new WikivoyageClient(),
    landmarks: new LandmarkPhotoClient(),
    meteo: new OpenMeteoClient(),
    exchange: new ExchangeClient(),
    nature: new INaturalistClient(),
  };
}

export { ExchangeClient };
