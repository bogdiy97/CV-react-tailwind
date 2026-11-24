# Fior – materiale pentru Instagram

Doar prezentare de produs: fără prețuri, oferte sau îndemnuri de cumpărare.

- **10 postări** pătrate (1080×1080), în `png/`
- **5 carusele** cu idei și rețete (1080×1350, 26 de slide-uri), în `png/carusele/`
- **5 videouri din carusele** verticale (1080×1920, MP4, cu sunet), în `video/`, plus copii fără sunet
- **1 film de brand** vertical (1080×1920, 26 s, cu sunet), în `video/fior-film.mp4`, plus o copie fără sunet
- **Filmul 2, „Aurul toamnei”** (1080×1920, 32 s, cu sunet, efecte WebGL), în `video/fior-film-2.mp4`, plus o copie fără sunet

## Videouri de produs (WebGL)

Câte unul pentru fiecare băutură, 20 s, vertical, cu sunet: `video/fior-video-gutui.mp4`, `-sangria`, `-hugo`, `-hard-lemonade`, `-gama` (plus copii fără sunet).

Aceeași structură, cu culorile, ingredientele și tonalitatea fiecărei băuturi:
1. Lichidul băuturii (aur, vin, verde-auriu, lămâie) din care iese numele în relief.
2. Sticla luminată din spate, cu ilustrațiile ingredientelor; bule la Hugo și Hard Lemonade.
3. Zoom în fotografia produsului, văzută prin lichid.
4. Ingredientele pe beat (zmeură, mure, portocală, scorțișoară etc.), alternând cu sticla și fotografia.
5. Particulele formează silueta sticlei (sau logo-ul, la gamă), explodează și se reasamblează.

Conținutul fiecărui video (texte, ingrediente, culori) e în `film/produse.js`.

```bash
node fior-bannere/film/render-film.cjs sangria       # -> video/fior-video-sangria.mp4
```

## Muzica

Toate videourile au muzică compusă din cod (`film/muzica.py`) și cântată cu instrumente reale eșantionate (pian electric, corzi, bas, tobe, celestă, vibrafon) prin FluidSynth, cu banca de sunete FluidR3 GM (licență MIT). Nu există drepturi de autor de rezolvat. Muzica urmează filmul: intro liniștit, strofă, drop pe tăieturile rapide, final cu pian și corzi, chimval la fiecare tranziție.

Cu `--doar-sunet`, scripturile pun muzică nouă pe varianta fără sunet, fără să mai randeze imaginea:

```bash
node fior-bannere/film/render-film.cjs sangria --doar-sunet
node fior-bannere/render-reels.cjs la-ski --doar-sunet
```

Necesită: `apt install fluidsynth fluid-soundfont-gm` și `pip install mido numpy`.

## Film 2 – „Aurul toamnei” (WebGL)

1. Aur lichid din care se ridică logo-ul în relief; aurul se retrage cu margini incandescente.
2. Sticla de gutui luminată din spate: raze volumetrice, praf auriu, reflexii de lumină pe podea.
3. Zoom prin eticheta sticlei, iar fotografiile cu oameni apar ca printr-un lichid care se liniștește.
4. Drop pe beat: 8 tăieturi cu undă de șoc, aberație cromatică și raze colorate în spatele sticlelor.
5. Gama completă pe orbită, cu lumini bokeh și raze printre sticle.
6. Final: 30.000 de particule formează logo-ul, explodează pe drop și se reasamblează.

```bash
node fior-bannere/film/render-film.cjs 2    # -> video/fior-film-2.mp4 și video/fior-film-2-fara-sunet.mp4
```

Randarea folosește WebGL prin Chromium (merge și fără placă video, mai încet: ~10 minute).

## Film de brand

Logo-ul se formează din particule aurii, apoi apar sticla de gutui cu o rază de lumină, fotografiile cu oameni (cuplul la apus, fata de la lac), cadre rapide pe ritm cu Berry Sangria, Elderberry Hugo, Lichior de gutui și Hard Lemonade, gama completă pe o orbită 3D și finalul „Fiecare detaliu contează.”

```bash
python3 fior-bannere/film/puncte_logo.py   # doar dacă se schimbă logo-ul
node fior-bannere/film/render-film.cjs 1   # -> video/fior-film.mp4 și video/fior-film-fara-sunet.mp4
```

## Postări

| Fișier | Produs | Mesaj |
| --- | --- | --- |
| `png/craciun-01-un-fior-de-craciun.png` | Lichior de gutui | Un fior de Crăciun. |
| `png/craciun-02-afara-ninge.png` | Lichior de gutui | Afară ninge. Înăuntru, un fior. |
| `png/craciun-03-rosul-sarbatorilor.png` | Berry Sangria | Roșul sărbătorilor. |
| `png/craciun-04-singur-sau-impreuna.png` | Toată gama | Singur sau împreună. |
| `png/craciun-05-craciun-fericit.png` | Lichior de gutui | Crăciun fericit! |
| `png/general-01-lichior-de-gutui.png` | Lichior de gutui (fotografia oficială) | Gust tandru și delicat, așa cum ești și tu. |
| `png/general-02-berry-sangria.png` | Berry Sangria | Zmeură, mure, portocală și scorțișoară |
| `png/general-03-elderberry-hugo.png` | Elderberry Hugo | Flori de soc, lămâie și mentă |
| `png/general-04-hard-lemonade.png` | Hard Lemonade (4 arome) | Patru arome răcoritoare. Un singur fior. |
| `png/general-05-fiecare-detaliu-conteaza.png` | Lichior de gutui | Din gutui românești. |

## Carusele și Reels

Fiecare carusel are și o variantă Reel cu același conținut, animată.

| Carusel | Reel | Conținut |
| --- | --- | --- |
| `png/carusele/dupa-job/` | `video/dupa-job.mp4` | Seara după job: Hard Lemonade la gheață, Gutui & tonic, Hugo cu mentă |
| `png/carusele/pe-plaja/` | `video/pe-plaja.mp4` | Pe plajă: Hard Lemonade, Sangria slush, Hugo spritz |
| `png/carusele/la-ski/` | `video/la-ski.mp4` | Après-ski: ceai fierbinte cu gutui, Berry Sangria caldă, lichior de gutui simplu |
| `png/carusele/langa-brad/` | `video/langa-brad.mp4` | Lângă brad: Fior de Crăciun, punch de sărbători, înghețată cu gutui |
| `png/carusele/retete/` | `video/retete.mp4` | 4 rețete: Gutui sour, Sangria royale, Hugo smash, Ginger lemonade |

Videourile din carusele au muzică (vezi „Muzica”), cu chimval la fiecare schimbare de slide. Copiile `-fara-sunet.mp4` sunt pentru cine vrea muzică din biblioteca Instagram.

## Sursa materialelor

- **Sticle, fotografii și logo:** de pe fiordrinks.ro. Sticlele sunt decupate de pe fundalul alb cu `cutout.py`, fără nicio modificare a sticlei. Logo-ul (`imagini/logo-fior.png`) e extras din `logo-round.png`, iar variantele `-auriu` și `-crem` sunt aceeași formă recolorată pentru fundaluri închise.
- **Texte:** ingredientele și afirmațiile despre produse vin de pe etichete și de pe site. Rețetele sunt propuneri noi, cu produsele Fior.
- **Fonturi:** Playfair și Open Sans, aceleași ca pe fiordrinks.ro (licența SIL OFL, vezi `fonts/`).

## Structura

| Fișier | Rol |
| --- | --- |
| `fior.css` | fonturi, culori (blocul `:root`) și componente comune |
| `fior.js` | desenele aurii (sprite SVG), zăpada, umbrele |
| `bannere.html` | cele 10 postări |
| `continut.js` | **toate textele și rețetele** din carusele și Reels |
| `slides.js`, `slides.css` | șabloanele de slide (copertă, idee, rețetă, final) și scenele pe teme |
| `carusele.html` | caruselele |
| `reel.html`, `reel.js` | Reel-urile (`reel.html?c=dupa-job` etc.) |
| `video-capture.cjs` | captura cadru cu cadru în MP4, folosită de Reels și de film |
| `film/` | filmele: `desen.js` (desen 2D), `gpu.js` (WebGL), `shadere.js` (efecte), `motor.js` (scene și post-procesare comune), `film.js`, `film-2.js`, `film-produs.js` + `produse.js` (scenele), `muzica.py` (muzica: MIDI cântat cu FluidSynth) |

## Cum modifici

- **Texte și rețete din carusele și Reels:** în `continut.js`. Se schimbă automat în ambele formate.
- **Texte din postări:** în `bannere.html`, câte o `<section class="banner">` pentru fiecare.
- **Culori și fonturi:** blocul `:root` din `fior.css`.
- **O sticlă nouă:** `python3 fior-bannere/cutout.py poza.jpg fior-bannere/imagini/nume.png`, apoi numele ei în `products` din `continut.js`.

## Export

```bash
node fior-bannere/render.cjs                 # postările -> png/
node fior-bannere/render.cjs carusele.html   # caruselele -> png/carusele/
node fior-bannere/render-reels.cjs           # videourile din carusele, cu sunet -> video/ (sau doar unul: ... render-reels.cjs la-ski)
```

Ai nevoie de Playwright cu Chromium, iar pentru Reels și de ffmpeg.
