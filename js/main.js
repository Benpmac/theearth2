// =====================================================================
// main.js — point d'entrée
// ---------------------------------------------------------------------
//   1. on crée les services (un objet par API) ;
//   2. on charge la planète Terre : Planet.load() fabrique l'instance
//      `earth` et tous ses objets Country ;
//   3. on lance l'application.
// =====================================================================

import { App } from "./core/App.js";
import { Planet } from "./models/Planet.js";
import { createServices } from "./services/index.js";

async function start() {
  const services = createServices();
  const earth = await Planet.load({ name: "Terre", services });

  // Pour explorer le modèle dans la console du navigateur (F12) :
  //   earth.country("CI").neighbors   ·   await earth.country("JP").weather()
  window.earth = earth;

  const app = new App(earth);
  app.start();
  document.body.classList.remove("is-loading");
}

start().catch((error) => {
  console.error(error);
  const loader = document.getElementById("loader");
  loader.classList.add("is-error");
  loader.querySelector(".loader__text").textContent =
    "Impossible de charger les pays. Vérifie ta connexion internet, et ouvre le site avec un serveur local (Live Server), pas en double-cliquant sur le fichier.";
});
