// =====================================================================
// format.js — nombres, dates et coordonnées "à la française"
// =====================================================================

const LOCALE = "fr-FR";
const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });

export const formatInt = (n) => integer.format(n);
export const formatDecimal = (n, digits = 1) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
export const formatCompact = (n) => compact.format(n);
export const formatArea = (km2) => `${integer.format(km2)} km²`;

export function formatPeople(n) {
  if (n >= 1e9) return `${formatDecimal(n / 1e9, 2)} milliard${n >= 2e9 ? "s" : ""}`;
  if (n >= 1e6) return `${formatDecimal(n / 1e6, 1)} million${n >= 2e6 ? "s" : ""}`;
  return integer.format(n);
}

export function formatLocalTime(utcOffsetSeconds, date = new Date()) {
  return new Date(date.getTime() + utcOffsetSeconds * 1000).toISOString().slice(11, 16);
}

export function formatUtcOffset(seconds) {
  const sign = seconds < 0 ? "−" : "+";
  const abs = Math.abs(seconds);
  const hh = String(Math.floor(abs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

// "2026-11-02" → "lun. 2"
export function formatDay(isoDate) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

// "2026-12-25" → "vendredi 25 décembre 2026"
export function formatLongDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const MONTHS_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
// Jours de la semaine dans l'ordre ISO : 1 = lundi … 7 = dimanche
export const WEEKDAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function normalize(text) {
  return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
