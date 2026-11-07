# TheEarth — version simple

**Visitez un pays depuis votre canapé.** La version simple de TheEarth : pas de globe, l'accueil
est la liste des 250 pays et territoires, et chaque pays a sa page. Plus légère à charger (aucune
bibliothèque externe, pas de contours du monde), et faite pour lire : un **mode lecture** ouvre les
longs textes dans une liseuse confortable (voir plus bas).

Chaque page est un carnet de voyage en 4 étapes :

| Étape | Chapitres |
| --- | --- |
| **Découvrir** | Bienvenue (Wikipédia + 3 chiffres) · L'essentiel (capitale, langue, monnaie, relief) |
| **À voir** | Paysages (mosaïque de photos, visionneuse) · Faune et flore à observer (fiches en éventail) |
| **Préparer** | Quand partir (les mois les plus agréables + la météo du moment) · Infos pratiques · Fêtes et jours fériés · Avant de partir (guide) |
| **Sur place** | Manger et boire · Le guide sur place (se déplacer, que faire, parler, coutumes, se loger) |

L'accueil, **Destinations**, range les 250 pays par continent, de A à Z (filtre par continent) ;
**Au hasard** ouvre un pays tiré au sort ; la recherche, en haut, trouve un pays par son nom, son nom
anglais ou sa capitale.

## Le mode lecture

Le site contient beaucoup de texte (la présentation Wikipédia, le guide Wikivoyage). Dans la page,
il reste court : 10 paragraphes au plus par rubrique. Le bouton **Mode lecture** (ou **Lire tout le
guide**, **Lire la suite en mode lecture**) l'ouvre en entier dans une liseuse plein écran :

- **Une colonne de lecture** de 34 em au plus (≈ 65 signes par ligne), interligne 1,7, paragraphes
  aérés, césure et `text-wrap: pretty` (pas de mot seul en fin de paragraphe).
- **Réglages**, retenus d'une visite à l'autre : 5 tailles de texte (17 à 26 px ; boutons A, ou
  touches + et −), deux polices (Serif : Fraunces, plus « livre » ; Sans : Inter), trois fonds tirés
  des palettes :

  | Fond | Couleurs | Contraste du texte |
  | --- | --- | --- |
  | Papier (défaut en mode clair) | #F3E5D2, texte #16171A | 14,5:1 |
  | Clair | #F0F0EA, texte #16171A | 15,7:1 |
  | Nuit (défaut en mode sombre) | #0A1024, texte #B7C4D9 (moins éblouissant que le blanc) | 10,7:1 |

- **Sommaire** des rubriques (à gauche sur ordinateur, bouton « Sommaire » sur téléphone), qui
  signale la rubrique en cours ; **barre de progression** en haut ; **temps de lecture** estimé
  (220 mots par minute) ; source et licence en fin de texte.
- Sur téléphone, l'en-tête tient sur une ligne : Fermer · Sommaire · **Aa** (les réglages).
- Échap ferme la liseuse et rend le focus au bouton d'origine ; la page derrière ne défile pas.

Le code : `js/views/Reader.js` (une seule liseuse pour tout le site, sur l'élément `<dialog>`) et
`css/components/reader.css`. Pour l'ouvrir depuis un nouveau chapitre :

```js
Reader.open({
  kicker: "Japon · Le guide du voyageur",
  title: "Avant de partir",
  source: { name: "Wikivoyage", label: "Wikivoyage, « Japon »", url, licence: "CC BY-SA" },
  sections: [{ title: "Comprendre le pays", load: async () => blocs }],   // blocs : [{ type: "p" | "h" | "li", text }]
  start: 0,
});
```
Tout ce qui ne sert pas à découvrir ou visiter un pays (économie, énergie, institutions, radio,
football, actualités, recettes, comparateur, classements, quiz) a été retiré.

## Mettre le site en ligne (GitHub Pages)

Le site n'a besoin d'aucun serveur : GitHub Pages peut l'héberger gratuitement.

1. Publie ce dossier dans un dépôt GitHub **public** (par exemple `theearth`).
2. Sur github.com, dans le dépôt : **Settings → Pages**, puis
   *Source* : **Deploy from a branch**, *Branch* : **main** et **/ (root)**, et **Save**.
3. Une à deux minutes plus tard, le site est en ligne à l'adresse
   `https://TON-PSEUDO.github.io/theearth/`.

Le fichier `.nojekyll` dit à GitHub de servir les fichiers tels quels, et `.gitignore` liste
ce qui ne doit pas être envoyé (`node_modules`, fichiers système).

## Lancer le site

Le site doit être servi par un petit serveur local (un double-clic sur `index.html` ne suffit pas :
les navigateurs bloquent les modules JavaScript et `fetch` en `file://` — le site l'explique à l'écran).

- **VS Code** : extension *Live Server*, clic droit sur `index.html` > *Open with Live Server*.
- **Python** : `python -m http.server 8000`, puis http://localhost:8000
- **Node.js** : `npx serve`

Une connexion internet est nécessaire. Astuce : dans la console du navigateur (F12), tape
`earth.country("CI")` pour explorer le modèle objet en direct.

## Des photos nettes

Une photo floue, c'est presque toujours une petite image étirée. Le site :

1. **N'utilise plus la bannière Wikivoyage** (2100 × 300 px, étirée sur 700 px de haut, d'où le flou).
   La bannière de chaque pays est la photo d'un de ses lieux emblématiques, choisie de préférence
   en paysage et d'au moins 1 600 px de large (voir « Les bannières » plus bas).
2. **Propose plusieurs tailles** à chaque image (`srcset` + `sizes`, voir `js/utils/images.js`) :
   le navigateur prend la plus petite qui reste nette sur CET écran. Bannière : 960 à 3840 px ;
   faune et flore : 500 ou 1024 px.
3. Toujours aux **largeurs autorisées par Wikimedia** (120, 250, 330, 500, 960, 1280, 1920, 3840) :
   les autres sont limitées depuis 2026.

## Les couleurs : 4 palettes, et rien d'autre

Toute l'interface est peinte avec les **24 couleurs exactes** des quatre palettes fournies,
déclarées une seule fois en tête de `css/tokens.css`. Aucune autre valeur n'est utilisée :
pas de gris pur, pas de noir ni de blanc purs, pas de couleur calculée.

| Palette | 950 | 800 | 700 / 600 | 500 / 400 | 300 / 200 | 100 / 50 |
| --- | --- | --- | --- | --- | --- | --- |
| **Terre** | `#16171A` | `#3A2525` | `#713A32` | `#A75B45` | `#D4A07A` | `#F3E5D2` |
| **Océan** | `#081A23` | `#0E4D55` | `#147B78` | `#5FA69B` | `#B8CEC6` | `#F0F0EA` |
| **Nuit** | `#0A1024` | `#1A2751` | `#344879` | `#7185A8` | `#B7C4D9` | `#F2F4F8` |
| **Pierre** | `#06141B` | `#11212D` | `#253745` | `#4A5C6A` | `#9BA8AB` | `#CCD0CF` |

**Qui fait quoi** (méthode couleur-impact : neutres teintés, un seul accent, contraste chaud/froid) :

- **Nuit** : tout ce qui est « ciel » — barre du haut, onglets du téléphone, l'espace et les
  pied de page, voile sur les photos. Texte `#F2F4F8`, texte secondaire `#B7C4D9`.
- **Terre** : le papier du carnet (`#F3E5D2`), le texte (`#16171A`) et **l'accent unique** :
  brun `#713A32` sur fond clair (liens, bouton principal, étape active), sable `#D4A07A` sur fond
  sombre (bouton principal sur la photo, onglet actif, mode sombre).
- **Océan** : les cartes de contenu (`#F0F0EA`).
- **Pierre** : texte secondaire et filets en mode clair, et **tout le mode sombre**
  (fond `#06141B`, cartes `#11212D`, filets `#253745`, texte secondaire `#CCD0CF`).

Les composants n'utilisent jamais ces couleurs directement, seulement des **rôles**
(`--paper`, `--surface`, `--ink`, `--ink-soft`, `--c-ink`, `--sky-deep`, `--accent-on-sky`…) :
changer une palette, c'est changer une ligne dans `tokens.css`.

Les **drapeaux restent des images** (ils montrent le pays), mais ne colorent plus l'interface :
la page de chaque pays a désormais la même palette que le reste du site. Les couleurs extraites
des drapeaux sont toujours dans `data/` si l'on veut un jour les réutiliser.

Contrastes mesurés (WCAG 2.2, minimum AA : 4,5:1 pour le texte) :

| Paire | Clair | Sombre |
| --- | --- | --- |
| Texte sur papier | 14,5:1 | 16,3:1 |
| Texte sur carte | 15,7:1 | 14,4:1 |
| Texte secondaire et sources sur carte | 6,1:1 | 10,6:1 |
| Liens (brun / sable) sur carte | 7,8:1 | 7,1:1 |
| Texte du bouton principal | 7,2:1 | 7,8:1 |
| Texte sur la nuit (barre du haut, pied de page) | 17,1:1 | 17,1:1 |
| Sable sur la nuit (onglet actif, accent) | 8,2:1 | 8,2:1 |

Vérifié aussi avec APCA (la méthode prévue pour WCAG 3) : le corps du texte dépasse Lc 90 dans les
deux modes. Seule limite, propre à la palette : en mode sombre, les liens sable sur les cartes
atteignent Lc 55 (7,1:1 en WCAG) — confortables, mais sous la cible APCA de Lc 60 pour un petit texte.
Ils sont soulignés, donc reconnaissables sans la couleur.

### Vérifier les couleurs

`audit_palette.py` (dans le dossier de travail) ouvre l'accueil, les destinations et deux pages pays,
en clair et en sombre, relève la couleur calculée de chaque élément visible (texte, fond, bordures,
remplissages et traits SVG) et vérifie qu'elle appartient aux 24 couleurs. Résultat : **0 couleur
hors palette**. Les photos, drapeaux et le contenu des images ne sont pas
de l'interface et ne sont pas comptés.

## La typographie (méthode typographie-ui, d'après le rapport de recherche)

Le rapport complet, sourcé, est livré à part (« Typographie web et confort de lecture »).
Ce qu'il en ressort pour le site :

- **Deux familles libres, hébergées avec le site** (`polices/`, déclarées dans `css/polices.css`) :
  - **Inter 4.1** pour lire et agir (texte, boutons, chiffres) : la plus grande hauteur d'x des
    sans-serif comparées, des chiffres tabulaires, et toutes les lettres des noms de lieux du monde
    (vietnamien, ʻokina hawaïen, ɛ, ɔ, ŋ…) ;
  - **Fraunces** pour titrer : une serif chaleureuse, au ton de carnet de voyage, avec un axe
    de taille optique (les grands titres sont plus fins et serrés, les petits plus robustes).
- **Plus de Google Fonts** : aucun gain de cache depuis 2020, une connexion tierce en moins
  (vie privée, réseaux mobiles lents). Une page en français ne télécharge que 47 Ko d'Inter
  (préchargés) et 66 Ko de Fraunces ; les autres alphabets ne se chargent que s'ils apparaissent.
- **Pas de saut au chargement** : en attendant les polices, Arial et Georgia sont mises à
  l'échelle d'Inter et de Fraunces (`size-adjust`, valeurs calculées avec Capsize).
- **Échelle fluide** (méthode Utopia) : le corps passe de 17 px sur un téléphone de 360 px à
  19 px sur un écran de 1 240 px, et chaque pas de l'échelle suit le même rapport (1,2 → 1,25) :

| Jeton | Rôle | Téléphone → ordinateur | Police |
| --- | --- | --- | --- |
| — | nom du pays (bannière) | 38 → 148 px selon la longueur du nom | Inter 800, capitales |
| `--step-5` | titre de bandeau, chiffre clé (météo) | 42 → 58 px | Fraunces 500 / Inter 600 |
| `--step-4` | titre d'étape, de page | 35 → 46 px | Fraunces 500 |
| `--step-3` | titre de section | 29 → 37 px | Fraunces 500 |
| `--step-2` | titre de chapitre | 24 → 30 px | Fraunces 600 |
| `--step-1` | chapô, sous-titre | 20 → 24 px | Inter 400 / Fraunces 600 |
| `--step-0` | **corps du texte** | **17 → 19 px** | Inter 400 |
| `--step--1` | étiquettes, boutons, légendes | 14 → 15 px | Inter 500-600 |
| `--step--2` | surtitres en capitales, sources | 13 px | Inter 600 |

- **Confort de lecture** : lignes de 34 em au plus (≈ 68 signes), interligne 1,5 (1,6 sur grand
  écran), paragraphes séparés d'un interligne, césure sur téléphone, `text-wrap: balance` pour les
  titres et `pretty` pour les paragraphes, chiffres tabulaires pour les heures et les températures.
- **Typographie française automatique** : tout texte affiché passe par `frenchSpacing()`
  (`js/utils/dom.js`) — espace insécable avant « : », espace fine avant ; ! ? et dans « »,
  apostrophe typographique ’.
- **Mode sombre** : le texte clair paraît plus gras sur fond sombre, le corps descend à 380.

### Vérifier la typographie

Les tests (dans le dossier de travail, pas dans le site) vérifient : polices chargées, corps à
17 px et 19 px, mesure ≤ 34 em, aucun texte sous 12 px, pas de défilement horizontal à 320 px,
texte agrandi (taille par défaut doublée), espacements imposés de WCAG 1.4.12 sans texte coupé,
contrastes WCAG et APCA. Limite connue : une taille fluide (en `vw`) grandit un peu moins vite
que le zoom ; avec un écart maximal de 1,4× entre téléphone et ordinateur (bien sous la limite
de 2,5×), le zoom du navigateur atteint quand même 200 % de taille de texte.

## Le mode sombre, par défaut

- Le site s'ouvre **en mode sombre**, quel que soit le réglage de l'appareil.
- Le bouton **soleil / lune** de la barre du haut (à droite de la recherche ; à côté du logo sur
  téléphone) passe en clair, et inversement. Le choix est **retenu** pour les visites suivantes
  (stockage du navigateur ; en navigation privée, il ne vaut que pour la visite).
- Le choix est appliqué avant le premier affichage (petit script en tête de `index.html`) :
  pas d'éclair blanc au chargement.
- Côté code : tout repose sur `<html data-theme="light">`. Sans cet attribut, ce sont les rôles
  sombres de `css/tokens.css` qui s'appliquent. Le bouton : `js/views/ThemeSwitch.js`.

## Les bannières

### Continents (écran Destinations)

| Continent | Image | Fichier |
| --- | --- | --- |
| Afrique | carte de l'Afrique en pierre, éclairée | `img/continents/afrique.jpg` (+ `afrique-bandeau.jpg` sur grand écran) |
| Amériques | Monument Valley au clair de lune | `img/continents/ameriques.jpg` |
| Asie | la Grande Muraille dans la brume | `img/continents/asie.jpg` |
| Océanie | Sydney au coucher du soleil | `img/continents/oceanie.jpg` |
| Tous, Europe, Antarctique | épingles reliées sur la carte du monde | `img/fonds/epingles-reseau.jpg` |

- Le cadrage de chaque image est réglé dans `css/pages/destinations.css` (`--hero-pos`), séparément
  sur ordinateur et sur téléphone. La photo de l'Afrique, en hauteur, est posée entière à droite sur
  grand écran ; son bord gauche est fondu dans le bleu nuit du bandeau.
- Les deux photos de Sydney étaient enregistrées couchées : elles ont été redressées.
- **Europe** : l'image fournie (Europe vue de l'espace avec les étoiles du drapeau européen) porte
  le filigrane « dreamstime » : c'est une photo de banque d'images payante, elle n'est pas utilisée.
  Pour ajouter une image à l'Europe ou à l'Antarctique : la déposer dans `img/continents/`
  (`europe.jpg`, `antarctique.jpg`) et copier un bloc `.page-hero[data-region="…"]` du CSS.

### Pays

Chaque page pays prend sa bannière, dans cet ordre (`Country.coverPhoto()`) :

1. **une photo fournie avec le site** : `img/pays/` + une ligne dans `LOCAL_COVERS` (`js/config.js`).
   Aujourd'hui : l'Australie (vue aérienne de Sydney, l'une des deux photos fournies) ;
2. **la photo d'un lieu emblématique du pays**, trouvée en ligne : `data/lieux-couverture.json` donne
   2 ou 3 lieux par pays, choisis à la main pour leur paysage (le Machu Picchu, le Mont-Saint-Michel,
   la basilique de Yamoussoukro, le mont Fuji…, 713 lieux pour 250 pays et territoires). Le site
   demande leurs photos à la Wikipédia anglaise, en un seul appel, et ne garde que des **photos sous
   licence libre** hébergées sur Wikimedia Commons, de préférence en paysage et d'au moins 1 600 px.
   Le crédit sous la bannière donne le nom français du lieu et le lien vers la photo ;
3. la photo du pays sur Wikidata, si c'en est une vraie ;
4. la photo du site le plus connu ;
5. sinon, les épingles sur la carte ancienne (`img/fonds/epingles-carte-ancienne.jpg`).

**Plusieurs photos par pays.** La bannière est un diaporama (`HeroSlideshow`) : la photo de
couverture ci-dessus, puis 4 photos des Paysages (lieux emblématiques et sites de Wikidata), en
fondu enchaîné toutes les 7 secondes, avec un léger recul de l'image.
- Points en bas à droite pour aller à une photo, bouton pause (WCAG 2.2.2) ; le crédit suit la photo.
- Une photo n'est téléchargée qu'au moment d'être montrée (et la suivante juste avant).
- Le diaporama attend quand la bannière est hors de l'écran ou l'onglet caché, démarre en pause si
  le visiteur a demandé moins d'animations, et retire une photo qui ne se charge pas.

**Angles droits.** Aucune image n'a de bord arrondi : bannières, drapeaux, photos des Paysages,
visionneuse et fiches d'espèces (les panneaux et boutons, eux, restent arrondis).

Pour changer la photo d'un pays : modifier ses lieux dans `data/lieux-couverture.json` (titres
exacts des articles de la Wikipédia anglaise, dans l'ordre de préférence), ou ajouter une photo
locale. Ces titres n'ont pas pu être vérifiés un par un depuis l'atelier : un titre introuvable est
simplement ignoré et le site passe au suivant.

### Images de fond et droits

| Image | Où | Fichier |
| --- | --- | --- |
| Épingles reliées sur la carte | bandeau « Toutes les destinations », Europe, Antarctique | `img/fonds/epingles-reseau.jpg` |
| Épingles sur une carte ancienne | page pays en attendant sa photo (ou sans photo) | `img/fonds/epingles-carte-ancienne.jpg` |

- **Résolution** : les images fournies font 736 px de large (1 308 px pour Sydney). Sous leur voile,
  ça passe ; sur un grand écran, elles restent un peu douces. Pour les rendre nettes, remplace-les
  par des versions d'au moins 1 920 px de large (mêmes noms de fichiers) : rien d'autre à changer.
- **Droits** : vérifie que tu peux utiliser les images fournies sur un site public (leur source et
  leur licence ne sont pas connues). Ne sont pas utilisées : le panneau indicateur avec l'avion
  (filigrane 500px, photo n° 163752143) et l'Europe vue de l'espace (filigrane dreamstime).

## La page pays : une mise en page de magazine de voyage

Inspirée du modèle fourni (bannière arrondie, grand nom, colonnes, cartes) :

- **La bannière** : une grande photo aux coins arrondis, posée en retrait des bords. Le nom du pays
  s'y affiche en très grandes capitales (Inter 800), à une taille qui dépend de sa longueur (variable
  `--len`) : « Japon » remplit la bannière, « Saint-Vincent-et-les-Grenadines » tient aussi. Le code
  du pays (CI, JP…) est écrit en petit au pied du nom. En haut : fil d'Ariane, capitale, heure, météo.
  En bas : drapeau, nom officiel, région, et deux boutons pilule (plein clair et contour clair).
- **La barre des étapes** : une pilule centrée sous la bannière, qui reste en haut de l'écran.
- **En-têtes** : surtitre et titre à gauche, présentation à droite (étapes et chapitres).
- **Découvrir**, en deux colonnes sans panneau : à gauche le texte de Wikipédia et trois chiffres dans
  des ronds (habitants, superficie, pays voisins) ; à droite quatre cartes à icône (capitale et plus
  grande ville, langue et gentilé, monnaie, point culminant).
- **Faune et flore**, comme le second modèle : sur la carte ancienne assombrie, des fiches en éventail.
  La fiche du milieu est en avant ; les voisines reculent sous un voile bleu nuit. On fait défiler au
  doigt, avec les flèches, ou en touchant une fiche sur le côté. Chaque fiche : photo, nom, nom
  scientifique, description (1ʳᵉ phrase du résumé Wikipédia renvoyé par iNaturalist, en français),
  observations dans le pays et dans le monde, rang, groupe, et un bouton rond vers la fiche iNaturalist.
- **Les autres chapitres** dans de grands panneaux arrondis.
- **La barre des étapes** reste en haut de l'écran pendant tout le contenu du pays, puis s'efface
  avant le pied de page.

Couleurs (toujours les 4 palettes) : cartes à icône Pierre 500 en clair (#4A5C6A, texte 6,1:1) et
Pierre 700 en sombre ; chiffres sur ronds Pierre 700 ; fiches d'espèce sur #F0F0EA dans les deux modes,
chiffres en sarcelle #147B78 à 19 px gras (grand texte au sens du WCAG, 4,4:1 pour 3:1 demandé).

## Le pied de page : les sources et ceux qui ont fait le site

En bas de chaque page pays et de l'écran Destinations (à la place de l'ancien « Continuer le voyage ») :
un panneau bleu nuit, de la largeur de la bannière, avec

- **Ceux qui ont fait le site** : les personnes de `CREDITS` dans `js/config.js` (une ligne par
  personne : nom et rôle), puis, toujours, les bénévoles de Wikipédia, Wikivoyage et Wikidata et les
  photographes de Wikimedia Commons et d'iNaturalist ;
- **Les sources**, en quatre thèmes (textes et guides ; photos et nature ; météo, argent, calendrier ;
  cartes, drapeaux et outils) : 17 liens, chacun avec ce qu'il apporte au site et sa licence ;
- en bas, le rappel des licences et le plan du site (Destinations, Au hasard).

La liste des sources est dans `js/views/SiteFooter.js` (tableau `SOURCES`).

## Paysages : les plus beaux lieux de chaque pays, en photos

Sur chaque page pays, l'étape « À voir » commence par une galerie **Paysages** : jusqu'à 9 photos
de parcs nationaux, de sites du patrimoine mondial et de lieux emblématiques, en mosaïque (la
première en grand). Touchée, une photo s'ouvre en grand (`PhotoViewer`) avec le nom du lieu, son
auteur et sa licence (page Wikimedia Commons) ; flèches ← → pour passer d'une photo à l'autre.

- Les photos viennent de deux sources : les lieux emblématiques de `data/lieux-couverture.json`
  (photos de la Wikipédia anglaise) et les sites de Wikidata (`country.sites()`).
- `country.landscapes()` les rassemble, écarte les cartes et les doublons, et ne répète pas la
  photo de la bannière. Si Wikidata met plus de 12 s à répondre, la galerie se contente des lieux
  emblématiques ; sans aucune photo, le chapitre disparaît.
- On garde 1, 2, 3, 5 ou 9 photos : ces nombres remplissent la mosaïque sans laisser de trou.

## Le formulaire « Ton avis »

Une page `#/avis` (lien « Ton avis » en haut, dans les onglets du téléphone et dans le pied de page)
permet d'envoyer **une suggestion, un avis (avec une note sur 5) ou une erreur à signaler**.
En bas de chaque page pays, une invitation ouvre le formulaire avec le pays déjà choisi (`#/avis/CI`).

Le site n'a pas de serveur : les messages arrivent **par e-mail**, grâce à [Web3Forms](https://web3forms.com)
(gratuit, 250 messages par mois, sans compte). Pour le relier à ta boîte :

1. va sur https://web3forms.com, entre ton adresse e-mail et clique sur « Create Access Key » ;
2. ouvre l'e-mail reçu et copie la clé (access key) ;
3. colle-la dans `js/config.js`, dans `FEEDBACK.accessKey`.

La clé est faite pour être publique : elle permet seulement d'envoyer un message vers ta boîte.
Tant qu'elle manque, le formulaire s'affiche mais explique qu'il n'est pas encore relié.

Côté code : `models/Feedback.js` (le message et ses vérifications), `services/FeedbackClient.js`
(l'envoi), `views/FeedbackPage.js` (la page), `css/pages/feedback.css` (le style).
Erreurs affichées à côté du champ, saisie jamais effacée, un piège à robots invisible.

## La navigation (méthode composition-ux)

- Logo en haut à gauche → l'accueil (Destinations). Recherche avec loupe en haut à droite (raccourci `/`).
- Deux rubriques, **Destinations · Au hasard**, en haut sur ordinateur ; sur téléphone, une barre
  d'onglets en bas : Destinations · Rechercher (place le curseur dans la recherche) · Au hasard.
- Page pays : fil d'Ariane, une action principale en haut (« Découvrir le pays ») et une
  secondaire (« Préparer le voyage »), barre des 4 étapes qui suit le défilement, chapitres chargés
  à l'approche, accordéons pour le guide.
- La page s'arrête net en haut et en bas (`overscroll-behavior: none`) : plus de « rebond » qui
  laissait voir une bande vide au-dessus de la barre du haut (pavés tactiles, téléphones).
- Chaque chapitre a ses états : chargement (squelette), vide (message ou chapitre masqué), erreur
  (message clair + « Réessayer »). Une API en panne n'empêche jamais le reste de la page de s'afficher.

## L'architecture objet

```
                          ┌──────────────────────┐
                          │  Planet (earth)      │  name, radiusKm, surfaceKm2, ageYears
                          │  static load()       │  country(code), search(), byRegion(), random()
                          └──────────┬───────────┘
                                     │ contient 250
                          ┌──────────▼───────────┐
                          │  Country             │  attributs immédiats : code, name, capital, languages,
                          │  #memo  #services    │  currencies, colors, week, population…
                          └──┬───────────────┬───┘  méthodes async : coverPhoto(), sites(), weather(),
                             │ contient      │      climate(), profile(), travelGuide(), species()…
              ┌──────────────▼───┐       ┌───▼──────────────┐
              │  City            │       │  Site            │  photo(width), photoSrcset(), kind
              └────────┬─────────┘       └────────┬─────────┘
                       └───────────┬──────────────┘
                          ┌────────▼─────────┐
                          │  Place           │  name, lat, lon, distanceTo()
                          └──────────────────┘
  Species                                 autre classe du modèle

  ApiClient  (délai, cache partagé, serveurs de secours, erreurs claires dans la console)
   ├─ WikidataClient    ├─ OpenMeteoClient   ├─ ExchangeClient
   ├─ WikipediaClient   └─ INaturalistClient
   └─ WikivoyageClient   (Wikipédia et Wikivoyage héritent de MediaWikiClient)

  View  (show/hide, signal d'annulation)
   ├─ CountryPage (contient des Chapter)
   └─ DestinationsPage
  Chapter  (méthode modèle : squelette → load() → render())
   ├─ WelcomeChapter, EssentialsChapter, SightsChapter, NatureChapter,
   │  WhenToGoChapter, PracticalChapter, HolidaysChapter, FoodChapter
   └─ GuideChapter (rubriques Wikivoyage en accordéons)
       ├─ BeforeYouGoChapter   (static SECTIONS : comprendre, y aller, argent, santé, sécurité)
       └─ OnSiteChapter        (static SECTIONS : se déplacer, que faire, parler, coutumes, se loger)

  App (chef d'orchestre) · Router (adresse ↔ écran) · SearchBox
```

| Principe | Où le voir |
| --- | --- |
| Classe et instance | `Planet` est la classe, `earth` l'instance créée par `Planet.load()` (`js/main.js`) |
| Héritage (`extends`, `super`) | `City` et `Site` héritent de `Place` ; les services de `ApiClient` ; les chapitres de `Chapter` ; `BeforeYouGoChapter` et `OnSiteChapter` de `GuideChapter` |
| Encapsulation (champs `#privés`) | `Country.#memo`, `Planet.#countries`, `ApiClient.#cache`, l'état de `Reader` |
| Getters (attributs calculés) | `country.neighbors`, `country.capital`, `country.flag`, `site.kind`, `site.score` |
| Membres statiques | `Planet.load()`, `City.fromRow()`, `GuideChapter.SECTIONS`, `Reader.open()` (une instance partagée) |
| Polymorphisme | `CountryPage` appelle `run()` sur chaque chapitre ; chacun a son propre `load()` et `render()` |
| Méthode modèle | `Chapter.run()` fixe le déroulé, les sous-classes remplissent les étapes |
| Injection de dépendances | `createServices()` crée les services, `Planet.load({ services })` les transmet aux pays |
| Mémoïsation | `Country.#memo()` : chaque donnée n'est demandée qu'une fois, un échec peut être réessayé |

## Organisation des fichiers

```
theearth/
├── index.html                  les 3 écrans, barre du haut, onglets, garde-fou de démarrage
├── polices/                    Inter et Fraunces en WOFF2, découpées par alphabet (+ licences OFL)
├── img/
│   ├── continents/             bannières des continents (écran Destinations)
│   ├── pays/                   photos de bannière fournies (voir LOCAL_COVERS)
│   └── fonds/                  épingles sur la carte (bandeau par défaut, attente d'une photo)
├── css/
│   ├── polices.css             déclarations @font-face et polices de repli ajustées
│   ├── main.css                ordre des couches (@layer) et imports
│   ├── tokens.css              les 4 palettes, leurs rôles (clair et sombre), polices, espacements
│   ├── base.css · layout.css · utilities.css
│   ├── components/             boutons, barre du haut, recherche, onglets, états, contenus, liseuse, visionneuse, pied de page
│   └── pages/                  country, chapters, landscapes, destinations, feedback
├── js/
│   ├── main.js                 crée les services, charge earth, lance l'App
│   ├── config.js               adresses des API, largeurs d'images, photos de bannière locales, réglages
│   ├── core/                   App, Router
│   ├── models/                 Planet, Country, Place, City, Site, Species, Feedback
│   ├── services/               ApiClient et ses 7 sous-classes (dont LandmarkPhotoClient : photos des lieux), FeedbackClient
│   ├── views/                  View, CountryPage, HeroSlideshow, DestinationsPage, FeedbackPage, PhotoViewer, SearchBox, Reader, ThemeSwitch, SiteFooter
│   │   └── chapters/           Chapter + discover, see, prepare, onsite, guide
│   └── utils/                  dom, format, images (srcset), weather-codes
├── data/                       préparé par outils/ : pays, villes, pays/XX.json (jours fériés), drapeaux/xx.svg
│                               + lieux-couverture.json (lieux emblématiques, liste écrite à la main)
└── outils/                     build-data.js pour régénérer data/
```

## Quand quelque chose ne marche pas

1. Ouvre la console du navigateur (F12, onglet « Console »).
2. Chaque panne d'API y écrit une ligne : le service, le problème et l'adresse appelée, par exemple
   `[WikidataClient] Le service reçoit trop de demandes.` Les chapitres concernés affichent un message
   et un bouton « Réessayer » ; le reste de la page continue de fonctionner.
3. Si une API a changé, son adresse se corrige dans `js/config.js` (le seul fichier qui contient des URL).

Points à surveiller :

- **Wikidata** passe au moteur QLever (l'ancien s'arrête mi-2027). Les requêtes sont déjà écrites pour
  les deux ; seule l'adresse de `API.wikidata` pourrait changer.

## Étendre le site

- **Un nouvel attribut de pays** : un getter ou une méthode `async` dans `Country.js` (en passant par un service).
- **Une nouvelle API** : `class XClient extends ApiClient` dans `js/services/`, ajoutée à `createServices()`.
- **Un nouveau chapitre** : `class XChapter extends Chapter` avec `load()` et `render()`, ajoutée à `CountryPage.GROUPS`.
- **Une rubrique Wikivoyage de plus** : une ligne dans `SECTIONS` de `BeforeYouGoChapter` ou `OnSiteChapter`
  (et son titre dans `GUIDE_SECTIONS` de `MediaWikiClients.js` s'il n'y est pas).

## Régénérer les données

```
cd outils
npm install
npm run build
```

Le script télécharge les populations (Our World in Data), extrait les couleurs de chaque drapeau,
calcule le début de semaine et le week-end (Unicode CLDR) et les jours fériés de l'année en cours
et de la suivante, puis réécrit `data/`. Relance-le au début de chaque année.

## Sources et licences

Polices : Inter (Rasmus Andersson) et Fraunces (Undercase Type), SIL Open Font License 1.1.
Images de fond et bannières des continents : fournies pour le projet, droits à vérifier avant une mise en ligne publique.
Bannières des pays : photos sous licence libre de Wikimedia Commons, via la Wikipédia anglaise (crédit et lien sous chaque bannière).

Wikipédia et Wikivoyage (CC BY-SA), Wikidata (CC0), Wikimedia Commons (licence de chaque photo,
lien sous la bannière), Open-Meteo (CC BY 4.0), Our World in Data (CC BY 4.0),
iNaturalist (licences des photographes), ExchangeRate-API, Unicode CLDR,
GeoNames (CC BY 4.0, villes et capitales), world-countries (ODbL), flag-icons (MIT),
date-holidays (ISC, CC BY 3.0).
