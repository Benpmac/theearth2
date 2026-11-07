// =====================================================================
// weather-codes.js — traduire les codes météo en mots et en icônes
// ---------------------------------------------------------------------
// Open-Meteo décrit le temps avec les codes de l'Organisation
// météorologique mondiale (OMM) : 0 = ciel dégagé, 61 = pluie faible…
// =====================================================================

const CODES = {
  0: ["Ciel dégagé", "sun"],
  1: ["Plutôt dégagé", "sun"],
  2: ["Partiellement nuageux", "partly"],
  3: ["Couvert", "cloud"],
  45: ["Brouillard", "fog"],
  48: ["Brouillard givrant", "fog"],
  51: ["Bruine légère", "rain"],
  53: ["Bruine", "rain"],
  55: ["Bruine dense", "rain"],
  56: ["Bruine verglaçante", "rain"],
  57: ["Bruine verglaçante dense", "rain"],
  61: ["Pluie faible", "rain"],
  63: ["Pluie modérée", "rain"],
  65: ["Pluie forte", "rain"],
  66: ["Pluie verglaçante", "rain"],
  67: ["Pluie verglaçante forte", "rain"],
  71: ["Neige faible", "snow"],
  73: ["Neige modérée", "snow"],
  75: ["Neige forte", "snow"],
  77: ["Grains de neige", "snow"],
  80: ["Averses faibles", "rain"],
  81: ["Averses", "rain"],
  82: ["Averses violentes", "rain"],
  85: ["Averses de neige", "snow"],
  86: ["Fortes averses de neige", "snow"],
  95: ["Orage", "storm"],
  96: ["Orage avec grêle", "storm"],
  99: ["Orage avec forte grêle", "storm"],
};

// isDay : la nuit, un ciel dégagé s'affiche avec une lune
export function describeWeather(code, isDay = true) {
  const [label, iconName] = CODES[code] || ["Temps inconnu", "cloud"];
  return { label, icon: !isDay && iconName === "sun" ? "moon" : iconName };
}
