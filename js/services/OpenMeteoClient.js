// =====================================================================
// OpenMeteoClient — météo et climat (sans clé)
// ---------------------------------------------------------------------
// Deux serveurs Open-Meteo, une seule classe : la méthode url() de
// ApiClient accepte une adresse de base différente pour chaque appel.
// =====================================================================

import { API } from "../config.js";
import { ApiClient } from "./ApiClient.js";

// Arrondir : deux demandes pour le même lieu donnent la même URL (et profitent du cache)
const round = (n) => Math.round(n * 100) / 100;

export class OpenMeteoClient extends ApiClient {
  constructor() {
    super(API.forecast);
  }

  forecast(lat, lon) {
    return this.get("", {
      latitude: round(lat),
      longitude: round(lon),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
      timezone: "auto",
      forecast_days: 7,
    });
  }

  // Les 365 jours d'une année, regroupés par mois
  async yearClimate(lat, lon, year) {
    const json = await this.fetchJSON(
      this.url("", {
        latitude: round(lat),
        longitude: round(lon),
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
      }, API.archive)
    );
    const months = Array.from({ length: 12 }, (_, m) => ({ month: m, max: [], min: [], rain: 0 }));
    json.daily.time.forEach((day, i) => {
      const m = Number(day.slice(5, 7)) - 1;
      const max = json.daily.temperature_2m_max[i];
      const min = json.daily.temperature_2m_min[i];
      const rain = json.daily.precipitation_sum[i];
      if (max !== null) months[m].max.push(max);
      if (min !== null) months[m].min.push(min);
      if (rain !== null) months[m].rain += rain;
    });
    const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
    return months.map((m) => ({ month: m.month, tmax: mean(m.max), tmin: mean(m.min), rain: Math.round(m.rain) }));
  }
}
