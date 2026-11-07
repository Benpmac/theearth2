// City — une ville : un lieu (Place) qui a en plus une population.

import { Place } from "./Place.js";

export class City extends Place {
  constructor({ name, lat, lon, population, isCapital = false }) {
    super({ name, lat, lon });   // le constructeur de Place s'occupe du nom et de la position
    this.population = population;
    this.isCapital = isCapital;
  }

  // Plus de 10 millions d'habitants
  get isMegacity() {
    return this.population >= 10_000_000;
  }

  // Fabrique une ville à partir d'une ligne de data/cities.json : [nom, population, lat, lon, capitale]
  static fromRow([name, population, lat, lon, isCapital]) {
    return new City({ name, population, lat, lon, isCapital: isCapital === 1 });
  }
}
