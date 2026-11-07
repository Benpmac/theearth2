// =====================================================================
// build-data.js — prépare le dossier data/ (à lancer une fois)
// ---------------------------------------------------------------------
// Utilisation :  cd outils && npm install && npm run build
//
// Sources :
//   world-countries   noms, capitales, langues, monnaies, voisins (ODbL)
//   world-atlas       contours des pays, Natural Earth (domaine public)
//   all-the-cities    villes et populations, GeoNames (CC BY 4.0)
//   flag-icons        drapeaux en SVG (MIT) → couleurs de chaque pays
//   date-holidays     jours fériés de ~200 pays (ISC, CC BY 3.0)
//   Our World in Data population (CC BY 4.0), fichier CSV téléchargé depuis GitHub
//   Unicode CLDR      premier jour de la semaine, week-end (fourni par Node.js)
//
// Produit :
//   data/countries.json      les 250 pays (chargé au démarrage)
//   data/cities.json         ~15 grandes villes par pays
//   data/world-50m.json      contours détaillés
//   data/world-110m.json     contours simplifiés
//   data/pays/XX.json        jours fériés d'un pays (chargés à la demande)
//   data/drapeaux/xx.svg     drapeaux
// =====================================================================

const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = path.resolve(process.argv[2] || "../data");
const nm = (p) => path.join(__dirname, "node_modules", p);
const YEARS = [new Date().getFullYear(), new Date().getFullYear() + 1];   // jours fériés : cette année et la suivante

// ---------------------------------------------------------------------
// Petits outils
// ---------------------------------------------------------------------
function download(url, file) {
  if (fs.existsSync(file)) return Promise.resolve(fs.readFileSync(file, "utf8"));
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`${url} → ${res.statusCode}`));
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        fs.writeFileSync(file, body);
        resolve(body);
      });
    }).on("error", reject);
  });
}

// CSV simple (les fichiers OWID n'ont pas de virgule à l'intérieur des valeurs numériques)
function parseCsv(text) {
  const lines = text.split("\n").filter(Boolean);
  const head = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
const num = (v) => (v === undefined || v === "" ? null : Number(v));
const round = (v, d = 2) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

// --- Couleurs ---------------------------------------------------------
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const luminance = ([r, g, b]) => {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const chroma = (rgb) => Math.max(...rgb) - Math.min(...rgb);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Les couleurs d'un drapeau : on le dessine en 96×64 pixels et on compte les pixels
function flagPalette(svgText, Resvg) {
  const img = new Resvg(svgText, { fitTo: { mode: "width", value: 96 } }).render();
  const px = img.pixels;
  const counts = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  // Regroupe les teintes proches (bords adoucis, petits dégradés)
  const clusters = [];
  for (const [key, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const rgb = [(key >> 16) & 255, (key >> 8) & 255, key & 255];
    const near = clusters.find((c) => dist(c.rgb, rgb) < 60);
    if (near) near.n += n;
    else clusters.push({ rgb, n });
  }
  return clusters
    .filter((c) => c.n / total >= 0.025)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((c) => ({ rgb: c.rgb, share: c.n / total }));
}

// Thème d'un pays : une couleur d'accent lisible et sa version pâle
const PAPER = [245, 246, 242];
function themeFrom(palette) {
  const chromatic = palette.filter((c) => chroma(c.rgb) > 60 && c.share >= 0.04);
  // Score : présence dans le drapeau × intensité de la couleur, en pénalisant les teintes très claires
  // (un jaune vif ferait un texte illisible même assombri)
  const score = (c) => c.share * chroma(c.rgb) * (1 - 0.8 * luminance(c.rgb));
  const accent = (chromatic.sort((a, b) => score(b) - score(a))[0] || { rgb: [21, 32, 43] }).rgb;
  // Version "encre" : assombrie jusqu'à un contraste de 4,5:1 sur le papier (WCAG AA)
  let ink = accent;
  for (let t = 0; contrast(ink, PAPER) < 4.6 && t <= 1; t += 0.05) ink = mix(accent, [0, 0, 0], t);
  const second = chromatic.find((c) => dist(c.rgb, accent) > 90);
  return {
    accent: hex(accent),
    ink: hex(ink),
    soft: hex(mix(accent, [255, 255, 255], 0.88)),
    second: second ? hex(second.rgb) : null,
  };
}

// Premier jour de la semaine et jours du week-end (données CLDR fournies par Node)
// 1 = lundi … 7 = dimanche. Remplace l'API REST Countries, fermée en 2026.
function weekInfo(code) {
  try {
    const locale = new Intl.Locale(`und-${code}`).maximize();
    const info = locale.getWeekInfo ? locale.getWeekInfo() : locale.weekInfo;
    return info ? { first: info.firstDay, weekend: info.weekend } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
async function main() {
  fs.mkdirSync(path.join(OUT, "pays"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "drapeaux"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".cache"), { recursive: true });

  const countries = JSON.parse(fs.readFileSync(nm("world-countries/countries.json"), "utf8"));
  const cities = require(nm("all-the-cities"));
  const Holidays = require(nm("date-holidays"));
  const { Resvg } = require(nm("@resvg/resvg-js"));

  console.log("Téléchargement des populations (Our World in Data)…");
  const co2 = parseCsv(await download("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv", path.join(__dirname, ".cache/co2.csv")));
  const groupBy = (rows) => {
    const map = new Map();
    for (const r of rows) {
      if (!r.iso_code || r.iso_code.startsWith("OWID")) continue;
      if (!map.has(r.iso_code)) map.set(r.iso_code, []);
      map.get(r.iso_code).push(r);
    }
    for (const list of map.values()) list.sort((a, b) => Number(a.year) - Number(b.year));
    return map;
  };
  const co2By = groupBy(co2);

  // --- Traductions et noms français ------------------------------------
  const REG = { Africa: "Afrique", Americas: "Amériques", Asia: "Asie", Europe: "Europe", Oceania: "Océanie", Antarctic: "Antarctique" };
  const SUB = {
    "Northern Africa": "Afrique du Nord", "Western Africa": "Afrique de l'Ouest", "Middle Africa": "Afrique centrale",
    "Eastern Africa": "Afrique de l'Est", "Southern Africa": "Afrique australe", "North America": "Amérique du Nord",
    "Central America": "Amérique centrale", "Caribbean": "Caraïbes", "South America": "Amérique du Sud",
    "Central Asia": "Asie centrale", "Eastern Asia": "Asie de l'Est", "South-Eastern Asia": "Asie du Sud-Est",
    "Southern Asia": "Asie du Sud", "Western Asia": "Asie de l'Ouest", "Northern Europe": "Europe du Nord",
    "Western Europe": "Europe de l'Ouest", "Southern Europe": "Europe du Sud", "Eastern Europe": "Europe de l'Est",
    "Southeast Europe": "Europe du Sud-Est", "Central Europe": "Europe centrale",
    "Australia and New Zealand": "Australie et Nouvelle-Zélande", "Melanesia": "Mélanésie", "Micronesia": "Micronésie", "Polynesia": "Polynésie",
  };
  const langFr = new Intl.DisplayNames(["fr"], { type: "language" });
  const curFr = new Intl.DisplayNames(["fr"], { type: "currency" });
  const regFr = new Intl.DisplayNames(["fr"], { type: "region" });
  const clean = (s) => (s || "").replace(/d' /g, "d'").replace(/\s+/g, " ").trim();

  const flagDir = nm("flag-icons/flags/4x3");
  const C = [];
  for (const c of countries) {
    const a2 = c.cca3 === "UNK" ? "XK" : c.cca2;
    const tr = (c.translations && c.translations.fra) || {};
    let fr = clean(tr.common);
    if (!fr) {
      try { fr = regFr.of(a2); } catch { fr = c.name.common; }
    }
    const langs = Object.entries(c.languages || {}).map(([code, en]) => {
      let n = "";
      try { n = langFr.of(code); } catch {}
      return n && n.toLowerCase() !== code ? n : en;
    });
    const curs = Object.entries(c.currencies || {}).map(([code, v]) => {
      let n = "";
      try { n = curFr.of(code); } catch {}
      return { c: code, n: n && n !== code ? n : v.name, s: v.symbol || "" };
    });
    let idd = "";
    if (c.idd && c.idd.root) idd = c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.root + c.idd.suffixes[0] : c.idd.root;
    const dem = c.demonyms && c.demonyms.fra ? c.demonyms.fra : null;

    // Drapeau et couleurs
    let colors = [];
    let theme = null;
    const flagFile = path.join(flagDir, `${a2.toLowerCase()}.svg`);
    if (fs.existsSync(flagFile)) {
      const svg = fs.readFileSync(flagFile, "utf8");
      fs.writeFileSync(path.join(OUT, "drapeaux", `${a2.toLowerCase()}.svg`), svg);
      const palette = flagPalette(svg, Resvg);
      colors = palette.map((p) => hex(p.rgb));
      theme = themeFrom(palette);
    }

    // Dernière population connue (Our World in Data)
    const series = co2By.get(c.cca3) || [];
    const popRow = [...series].reverse().find((r) => num(r.population) !== null);

    C.push({
      a2, a3: c.cca3, n3: c.ccn3 || "",
      fr, en: c.name.common, enOff: c.name.official, off: clean(tr.official) || c.name.official,
      wk: weekInfo(a2),
      cap: c.capital || [],
      reg: REG[c.region] || c.region, sub: SUB[c.subregion] || c.subregion || "",
      lang: langs, cur: curs, ll: c.latlng, area: c.area, land: !!c.landlocked,
      bord: c.borders || [], tld: (c.tld || [])[0] || "", idd,
      dem: dem ? [dem.m, dem.f] : null, demEn: (c.demonyms && c.demonyms.eng && c.demonyms.eng.m) || "",
      ind: !!c.independent, un: !!c.unMember,
      colors, theme,
      pop: popRow ? [Number(popRow.year), num(popRow.population)] : null,   // [année, habitants]
    });
  }

  // --- Villes ---------------------------------------------------------
  const KEEP = new Set(["PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLC", "PPLG", "PPLS"]);
  const byCountry = {};
  for (const ct of cities) {
    if (!KEEP.has(ct.featureCode)) continue;
    (byCountry[ct.country] = byCountry[ct.country] || []).push(ct);
  }
  const km = (p, q) => {
    const [lo1, la1] = p.loc.coordinates, [lo2, la2] = q.loc.coordinates, r = Math.PI / 180;
    const a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const CITIES = {};
  for (const c of C) {
    const list = (byCountry[c.a2] || []).slice().sort((a, b) => b.population - a.population);
    const capNames = new Set(c.cap.map((s) => s.toLowerCase()));
    const capital = list.find((x) => x.featureCode === "PPLC") || list.find((x) => capNames.has(x.name.toLowerCase()));
    const top = [];
    const seen = new Set();
    for (const x of list) {
      const k = x.name.toLowerCase();
      if (seen.has(k)) continue;
      if (x !== capital && top.some((t) => km(t, x) < 20)) continue;   // quartiers d'une même agglomération
      seen.add(k);
      if (top.length < 15) top.push(x);
    }
    if (capital && !top.includes(capital)) top.push(capital);
    CITIES[c.a2] = top.map((x) => [x.name, x.population, r4(x.loc.coordinates[1]), r4(x.loc.coordinates[0]), x === capital ? 1 : 0]);
    if (capital) c.capll = [r4(capital.loc.coordinates[1]), r4(capital.loc.coordinates[0])];
  }

  // --- Jours fériés de chaque pays (fichier chargé à la demande) --------
  const supported = new Holidays().getCountries();
  const LATIN = /^[\p{Script=Latin}\p{N}\s'’().,/-]+$/u;
  for (const c of C) {
    let holidays = [];
    if (supported[c.a2]) {
      const hd = new Holidays(c.a2);
      for (const year of YEARS) {
        const fr = hd.getHolidays(year, "fr") || [];
        const enList = hd.getHolidays(year, "en") || [];
        fr.forEach((h, i) => {
          if (!["public", "optional"].includes(h.type)) return;   // jours fériés et jours facultatifs
          const name = LATIN.test(h.name) ? h.name : (enList[i] && enList[i].name) || h.name;
          holidays.push([h.date.slice(0, 10), name, h.type]);
        });
      }
      // un même jour peut revenir (férié + bancaire) : on garde le premier
      const seenDays = new Set();
      holidays = holidays.filter(([d, n]) => !seenDays.has(d + n) && seenDays.add(d + n));
    }

    fs.writeFileSync(path.join(OUT, "pays", `${c.a2}.json`), JSON.stringify({ holidays }));
  }

  // --- Contours ---------------------------------------------------------
  const topo50 = JSON.parse(fs.readFileSync(nm("world-atlas/countries-50m.json"), "utf8"));
  const topo110 = JSON.parse(fs.readFileSync(nm("world-atlas/countries-110m.json"), "utf8"));
  const byN3 = new Map(C.filter((c) => c.n3).map((c) => [c.n3, c.a2]));
  for (const topo of [topo50, topo110]) {
    for (const g of topo.objects.countries.geometries) {
      const a2 = g.id ? byN3.get(g.id) : g.properties.name === "Kosovo" ? "XK" : "";
      g.properties = { a2: a2 || "", name: g.properties.name };
      delete g.id;
    }
  }

  C.sort((a, b) => a.fr.localeCompare(b.fr, "fr"));
  fs.writeFileSync(path.join(OUT, "countries.json"), JSON.stringify(C));
  fs.writeFileSync(path.join(OUT, "cities.json"), JSON.stringify(CITIES));
  fs.writeFileSync(path.join(OUT, "world-50m.json"), JSON.stringify(topo50));
  fs.writeFileSync(path.join(OUT, "world-110m.json"), JSON.stringify(topo110));

  console.log(`${C.length} pays · ${C.filter((c) => c.theme).length} palettes · ${C.filter((c) => c.pop).length} populations OWID`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
