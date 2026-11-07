// =====================================================================
// Place — un lieu de la Terre (classe mère de City et Site)
// ---------------------------------------------------------------------
// Tout ce qui a un nom et une position hérite de Place, et sait donc
// calculer sa distance avec n'importe quel autre lieu.
// =====================================================================

const EARTH_RADIUS_KM = 6371;
const toRadians = (deg) => (deg * Math.PI) / 180;

export class Place {
  constructor({ name, lat, lon }) {
    this.name = name;
    this.lat = lat;
    this.lon = lon;
  }

  // Ordre GeoJSON / d3 : [longitude, latitude]
  get coordinates() {
    return [this.lon, this.lat];
  }

  get hasPosition() {
    return Number.isFinite(this.lat) && Number.isFinite(this.lon);
  }

  // Distance à vol d'oiseau, en km (formule de haversine)
  distanceTo(other) {
    const dLat = toRadians(other.lat - this.lat);
    const dLon = toRadians(other.lon - this.lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(this.lat)) * Math.cos(toRadians(other.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
  }

  toString() {
    return this.name;
  }
}
