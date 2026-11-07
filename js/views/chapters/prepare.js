// =====================================================================
// Étape "Préparer" : Quand partir · Infos pratiques · Fêtes et jours fériés
// (le chapitre "Avant de partir" est dans guide.js)
// =====================================================================

import { ExchangeClient } from "../../services/index.js";
import { externalLink, h, icon, source } from "../../utils/dom.js";
import { capitalize, formatDecimal, formatInt, formatLocalTime, formatLongDate, formatUtcOffset, MONTHS, WEEKDAY_NAMES } from "../../utils/format.js";
import { describeWeather } from "../../utils/weather-codes.js";
import { Chapter, valueOf } from "./Chapter.js";

const list = (items) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} et ${items.at(-1)}` : items[0] || "");

// Les mois les plus agréables pour un voyageur : doux (18-30 °C l'après-midi) et
// moins pluvieux que la moyenne. À défaut, les trois mois les moins pluvieux.
export function bestMonths(months) {
  const valid = months.filter((m) => m.tmax !== null);
  if (!valid.length) return { months: [], reason: null };
  const rains = valid.map((m) => m.rain).sort((a, b) => a - b);
  const median = rains[Math.floor(rains.length / 2)];
  const pleasant = valid.filter((m) => m.tmax >= 18 && m.tmax <= 30 && m.rain <= median).sort((a, b) => a.rain - b.rain).slice(0, 4);
  if (pleasant.length) return { months: pleasant.map((m) => m.month).sort((a, b) => a - b), reason: "doux et peu pluvieux" };
  const driest = [...valid].sort((a, b) => a.rain - b.rain).slice(0, 3);
  return { months: driest.map((m) => m.month).sort((a, b) => a - b), reason: "les moins pluvieux" };
}

// ---------------------------------------------------------------------
// Quand partir : les mois les plus agréables (d'après le climat de l'an
// passé), puis la météo du moment. Pas de graphique : l'essentiel en deux phrases.
// ---------------------------------------------------------------------
export class WhenToGoChapter extends Chapter {
  static id = "quand-partir";
  static title = "Quand partir";

  async load() {
    this.year = new Date().getFullYear() - 1;
    const [weather, climate] = await Promise.allSettled([this.country.weather(), this.country.climate(this.year)]);
    if (weather.status === "rejected" && climate.status === "rejected") throw weather.reason;
    const months = valueOf(climate);
    return { weather: valueOf(weather), months: months?.some((m) => m.tmax !== null) ? months : null };
  }

  isEmpty({ weather, months }) {
    return !weather && !months;
  }

  render({ weather, months }) {
    const place = this.country.referencePlace.name;
    const best = months ? bestMonths(months) : null;
    return [
      best?.months.length
        ? h("p", { class: "best-months" },
            icon("sun", "icon best-months__icon"),
            h("span", {}, "Les mois les plus agréables à ", place, " : ", h("strong", {}, list(best.months.map((m) => MONTHS[m]))), ` (${best.reason} en ${this.year}).`))
        : null,
      weather ? this.#now(weather) : null,
      source("Source : ", externalLink("https://open-meteo.com", "Open-Meteo"), ` · météo du moment et climat de ${this.year}`),
    ];
  }

  #now(weather) {
    const now = weather.current;
    const today = describeWeather(now.weather_code, now.is_day === 1);
    return h("div", { class: "weather-now" },
      icon(today.icon, "icon weather-now__icon"),
      h("div", {},
        h("p", { class: "weather-now__label" }, `En ce moment à ${this.country.referencePlace.name}`),
        h("p", { class: "weather-now__temp" }, `${Math.round(now.temperature_2m)} °C`),
        h("p", {}, today.label)));
  }
}

// ---------------------------------------------------------------------
// Infos pratiques : ce qu'il faut savoir en arrivant
// ---------------------------------------------------------------------
export class PracticalChapter extends Chapter {
  static id = "pratique";
  static title = "Infos pratiques";

  async load() {
    const [profile, rates, weather] = await Promise.allSettled([this.country.profile(), this.country.exchangeRates(), this.country.weather()]);
    return { profile: valueOf(profile), rates: valueOf(rates), weather: valueOf(weather) };
  }

  isEmpty() {
    return false;   // l'indicatif, la monnaie et la semaine sont toujours connus
  }

  render({ profile, rates, weather }) {
    const c = this.country;
    const tile = (iconName, label, value, note = null) =>
      value ? h("li", { class: "tile" }, icon(iconName, "icon tile__icon"), h("span", { class: "tile__label" }, label), h("span", { class: "tile__value" }, value), note ? h("span", { class: "tile__note" }, note) : null) : null;

    // L'heure du pays, qui avance toute seule (arrêtée quand on quitte la page)
    let clock = null;
    if (weather) {
      const offset = weather.utc_offset_seconds;
      clock = h("span", { class: "mono" }, formatLocalTime(offset));
      const timer = setInterval(() => (clock.textContent = formatLocalTime(offset)), 15000);
      this.signal?.addEventListener("abort", () => clearInterval(timer));
    }
    const zones = profile?.timeZones || [];
    const timeNote = weather
      ? `${formatUtcOffset(weather.utc_offset_seconds)}${zones.length > 1 ? ` · ${zones.length} fuseaux dans le pays` : ""}`
      : null;

    const { weekend } = c.week;
    const plugs = profile?.plugTypes?.length ? profile.plugTypes.map((p) => p.replace(/^(prise|fiche) (électrique )?(de )?type /i, "").replace(/^type /i, "")).join(", ") : null;

    // Taux de change de la monnaie principale
    let fx = null;
    const currency = c.mainCurrency;
    if (rates && currency) {
      const lines = [];
      const add = (from, symbol, to) => {
        const v = ExchangeClient.convert(rates.rates, from, to);
        if (v) lines.push(`1 ${symbol} = ${v >= 1000 ? formatInt(v) : formatDecimal(v, v >= 10 ? 2 : 4)} ${to}`);
      };
      if (currency.code !== "EUR") add("EUR", "€", currency.code);
      if (currency.code !== "USD") add("USD", "$", currency.code);
      if (currency.code === "EUR") add("EUR", "€", "USD");
      fx = lines.length ? lines.join(" · ") : null;
    }

    return [
      h("ul", { class: "tiles", role: "list" },
        tile("clock", "Heure locale", clock, timeNote),
        tile("coins", "Monnaie", currency ? `${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}` : null, fx),
        tile("plug", "Prises électriques", plugs ? `Type ${plugs}` : null, profile?.voltage ? `${profile.voltage} V` : null),
        tile("car", "On roule à", profile?.drivingSide || null),
        tile("siren", "Numéros d'urgence", profile?.emergency?.length ? profile.emergency.join(" · ") : null),
        tile("phone", "Indicatif téléphonique", c.callingCode),
        tile("calendar", "Week-end", weekend?.length ? capitalize(list(weekend.map((d) => WEEKDAY_NAMES[d - 1]))) : null, `La semaine commence le ${WEEKDAY_NAMES[c.week.first - 1]}`)),
      source("Sources : Wikidata, Open-Meteo (heure), Unicode CLDR (semaine), ",
        rates ? externalLink("https://www.exchangerate-api.com", "Rates By Exchange Rate API") : "taux indisponibles",
        rates?.updated ? ` · taux du ${new Date(rates.updated).toLocaleDateString("fr-FR")}` : ""),
    ];
  }
}

// ---------------------------------------------------------------------
export class HolidaysChapter extends Chapter {
  static id = "fetes";
  static title = "Fêtes et jours fériés";
  emptyText = "Les jours fériés de ce pays ne sont pas encore connus de notre source.";

  load() {
    return this.country.upcomingHolidays(10);
  }

  render(holidays) {
    return [
      h("p", { class: "chapter__lead" }, "Les prochains jours fériés : administrations et banques ferment, les transports sont souvent chargés."),
      h("ol", { class: "holidays", role: "list" }, holidays.map((d) =>
        h("li", { class: "holidays__item" },
          h("time", { datetime: d.date, class: "holidays__date" }, capitalize(formatLongDate(d.date))),
          h("span", { class: "holidays__name" }, d.name),
          d.type === "optional" ? h("span", { class: "tag" }, "facultatif") : null))),
      source("Source : bibliothèque date-holidays · les fêtes religieuses peuvent varier d'un jour selon l'observation de la lune"),
    ];
  }
}
