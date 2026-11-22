# Fior – bannere de Crăciun

5 bannere de vânzare pentru feed-ul de Instagram (1080×1350, format 4:5).

| Fișier | Mesaj | Ofertă |
| --- | --- | --- |
| `png/01-cel-mai-dulce-fior.png` | Cel mai dulce fior de sub brad. | -20% la seturile cadou |
| `png/02-doua-plus-una.png` | Două pentru tine, una pentru Moș. | 2+1 |
| `png/03-mosul-nu-asteapta.png` | Moșul n-așteaptă. Nici stocul. | Livrare gratuită, comenzi până pe 18.12 |
| `png/04-ciocnim-un-fior.png` | Ciocnim un fior? | Set cadou: sticlă + 2 pahare |
| `png/05-fiori-pentru-toata-lista.png` | Fiori pentru toată lista. | -15% de la 3 sticle |

Ofertele, procentele și datele sunt exemple. Confirmă-le cu clientul înainte de publicare.

## Cum modifici

- **Texte:** direct în `bannere.html`, câte o secțiune `<section class="banner">` pentru fiecare banner.
- **Culori și fonturi:** blocul `:root` (design tokens) din `bannere.html`. Schimbă-le acolo și se aplică peste tot.
- **Logo și sticlă:** acum sunt placeholdere desenate (`.brand` și simbolul `#bottle` din sprite-ul SVG). Le poți înlocui cu logo-ul oficial și cu o fotografie PNG a sticlei.

## Export PNG

```bash
node fior-craciun-bannere/render.cjs
```

Ai nevoie de Playwright cu Chromium. PNG-urile se generează în `png/`.

Fonturi: Playfair Display, Great Vibes și Inter, toate sub licența SIL OFL (vezi `fonts/`).
