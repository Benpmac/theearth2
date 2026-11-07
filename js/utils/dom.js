// =====================================================================
// dom.js — créer des éléments HTML sans risque
// ---------------------------------------------------------------------
// h("p", { class: "muted" }, "Bonjour") crée <p class="muted">Bonjour</p>.
// Le texte est toujours placé avec textContent : un texte venu d'une API
// ne peut jamais être interprété comme du HTML (protection contre le XSS).
// =====================================================================

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset") {
      Object.assign(el.dataset, value);
    } else if (key === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith("--")) el.style.setProperty(prop, v);
        else el.style[prop] = v;
      }
    } else {
      el.setAttribute(key, value === true ? "" : value);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(frenchSpacing(String(child))));
  }
}

// Typographie française, appliquée à tout texte affiché par h() :
//   • une espace insécable avant « : », une espace fine insécable avant ; ! ? » et après «,
//     pour que le signe ne se retrouve jamais seul en début de ligne ;
//   • l'apostrophe typographique ’ à la place de l'apostrophe droite ' (Côte d’Ivoire).
// (Aucune propriété CSS ne fait cela : il faut le mettre dans le texte lui-même.)
const NBSP = "\u00A0";          // espace insécable
const NNBSP = "\u202F";         // espace fine insécable
export function frenchSpacing(text) {
  return text
    .replace(/(\p{L})'(?=\p{L})/gu, "$1\u2019")
    .replace(/[ \u00A0](:)(?=\s|$)/g, `${NBSP}$1`)
    .replace(/[ \u00A0]([;!?»])/g, `${NNBSP}$1`)
    .replace(/«[ \u00A0]/g, `«${NNBSP}`);
}

// Une icône du sprite SVG défini dans index.html
export function icon(name, className = "icon") {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(ns, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

export function skeleton(lines = 3) {
  return h("div", { class: "skeleton", "aria-hidden": "true" }, Array.from({ length: lines }, () => h("span")));
}

export function notice(text, { error = false, action = null } = {}) {
  return h("div", { class: error ? "notice notice--error" : "notice", role: error ? "alert" : null }, h("p", {}, text), action);
}

export function externalLink(href, text, className = null) {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer", class: className }, text);
}

export function source(...parts) {
  return h("p", { class: "source" }, ...parts);
}

// Une adresse web n'est acceptée que si elle commence par http(s)
export function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
