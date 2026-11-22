# Fior – bannere de prezentare

10 postări pătrate pentru Instagram (1080×1080, ca postările Fior), doar de prezentare: fără prețuri, oferte sau îndemnuri de cumpărare.

## Crăciun

| Fișier | Produs | Mesaj |
| --- | --- | --- |
| `png/craciun-01-un-fior-de-craciun.png` | Lichior de gutui | Un fior de Crăciun. |
| `png/craciun-02-afara-ninge.png` | Lichior de gutui | Afară ninge. Înăuntru, un fior. |
| `png/craciun-03-rosul-sarbatorilor.png` | Berry Sangria | Roșul sărbătorilor. |
| `png/craciun-04-singur-sau-impreuna.png` | Toată gama | Singur sau împreună. |
| `png/craciun-05-craciun-fericit.png` | Lichior de gutui | Crăciun fericit! |

## Generale

| Fișier | Produs | Mesaj |
| --- | --- | --- |
| `png/general-01-lichior-de-gutui.png` | Lichior de gutui (fotografia oficială) | Gust tandru și delicat, așa cum ești și tu. |
| `png/general-02-berry-sangria.png` | Berry Sangria | Zmeură, mure, portocală și scorțișoară |
| `png/general-03-elderberry-hugo.png` | Elderberry Hugo | Flori de soc, lămâie și mentă |
| `png/general-04-hard-lemonade.png` | Hard Lemonade (4 arome) | Patru arome răcoritoare. Un singur fior. |
| `png/general-05-fiecare-detaliu-conteaza.png` | Lichior de gutui | Din gutui românești. |

## Sursa materialelor

- **Sticle și logo:** fotografiile oficiale de pe fiordrinks.ro. Sticlele sunt decupate de pe fundalul alb cu `cutout.py`, fără nicio modificare a sticlei. Logo-ul (`imagini/logo-fior.png`) e extras din `logo-round.png`, iar variantele `-auriu` și `-crem` sunt aceeași formă recolorată pentru fundaluri închise.
- **Texte:** ingredientele și afirmațiile despre produse vin de pe etichete și de pe site (de exemplu „nefiltrat, fără arome și coloranți adăugați”).
- **Fonturi:** Playfair și Open Sans, aceleași ca pe fiordrinks.ro (licența SIL OFL, vezi `fonts/`).

## Cum modifici

- **Texte:** în `bannere.html`, câte o `<section class="banner">` pentru fiecare postare.
- **Culori, fonturi, dimensiuni:** blocul `:root` din `bannere.html`.
- **O sticlă nouă:** `python3 fior-bannere/cutout.py poza.jpg fior-bannere/imagini/nume.png`, apoi o folosești într-un `<figure class="product">`.

## Export PNG

```bash
node fior-bannere/render.cjs
```

Ai nevoie de Playwright cu Chromium. Imaginile se generează în `png/`.
