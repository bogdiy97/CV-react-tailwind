// Builds carousel slides from CAROUSELS (continut.js).
// Used by carusele.html (1080×1350 slides) and reel.html (1080×1920 scenes).

const THEMES = {
  job: { logo: 'logo-fior-crem.png', dark: true },
  plaja: { logo: 'logo-fior.png', dark: false },
  ski: { logo: 'logo-fior-crem.png', dark: true },
  brad: { logo: 'logo-fior-auriu.png', dark: true },
  retete: { logo: 'logo-fior.png', dark: false },
};

const PRODUCT_NAMES = {
  'lichior-gutui': 'Fior Lichior de gutui',
  'berry-sangria': 'Fior Berry Sangria',
  'elderberry-hugo': 'Fior Elderberry Hugo',
  'hl-lamaie-verde-ghimbir': 'Fior Hard Lemonade Lămâie verde și ghimbir',
  'hl-zmeura-lamaie': 'Fior Hard Lemonade Zmeură și lămâie',
  'hl-lamaie-menta': 'Fior Hard Lemonade Lămâie și mentă',
  'hl-soc-lamaie': 'Fior Hard Lemonade Soc și lămâie',
};

// Keeps the real size relation between bottles: the 500 ml liqueur is the tallest,
// the 275 ml Hard Lemonade the shortest.
const PRODUCT_SCALE = { 'lichior-gutui': 1, 'berry-sangria': 0.92, 'elderberry-hugo': 0.9 };
const HARD_LEMONADE_SCALE = 0.72;

function seededRandom(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function skylineMarkup() {
  const rand = seededRandom(42);
  let x = 0;
  let shapes = '';
  while (x < 1080) {
    const width = 50 + Math.round(rand() * 70);
    const height = 90 + Math.round(rand() * 170);
    shapes += `<rect x="${x}" y="${260 - height}" width="${width - 4}" height="${height}" fill="#17182b"/>`;
    for (let wy = 270 - height; wy < 250; wy += 22) {
      for (let wx = x + 8; wx < x + width - 14; wx += 16) {
        if (rand() < 0.3) shapes += `<rect x="${wx}" y="${wy}" width="7" height="10" fill="#f6c77a" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`;
      }
    }
    x += width;
  }
  return `<svg class="scene__skyline" viewBox="0 0 1080 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${shapes}</svg>`;
}

const SCENES = {
  job: () => skylineMarkup(),
  plaja: () => '<div class="scene__sun"></div><div class="scene__sea"></div><div class="scene__sand"></div>',
  ski: () => `<div class="snow" data-flakes="160"></div>
    <svg class="scene__mountains" viewBox="0 0 1080 900" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#8396c2" d="M0 330L120 220L210 280L330 140L450 260L560 170L690 290L800 150L930 250L1080 180V900H0Z"/>
      <path fill="#f4f7fb" d="M330 140L296 180L316 174L332 188L348 172L366 178ZM560 170L532 202L550 198L564 210L578 196L590 200ZM800 150L768 188L786 182L802 196L818 180L834 186ZM120 220L96 244L112 240L124 250L136 240L146 244Z"/>
      <path fill="#5a6f9e" d="M0 420L160 300L280 380L420 280L560 390L700 300L860 400L1000 320L1080 360V900H0Z"/>
      <path fill="#eef3f8" d="M420 280L392 312L410 306L424 318L438 304L452 310ZM700 300L672 330L690 326L704 336L718 324L730 328ZM160 300L136 326L152 322L164 332L176 320L186 326Z"/>
      <path fill="url(#g-snow)" d="M0 470C200 430 380 500 560 470C760 440 900 500 1080 460V900H0Z"/>
    </svg>`,
  brad: () => `<div class="bokeh"></div><div class="snow" data-flakes="70"></div>
    <svg class="scene__tree" viewBox="0 0 300 420" aria-hidden="true"><use href="#xmas-tree"/></svg>`,
  retete: () => '<div class="scene__frame"></div>',
};

function productsMarkup(names) {
  const items = names.map((name) => {
    const scale = PRODUCT_SCALE[name] ?? HARD_LEMONADE_SCALE;
    return `<figure class="product" style="--scale:${scale}"><img src="imagini/${name}.png" alt="${PRODUCT_NAMES[name]}"></figure>`;
  }).join('');
  return `<div class="slide__products" data-anim="rise">${items}</div>`;
}

const BODIES = {
  cover: (slide) => `
    <p class="eyebrow" data-anim>${slide.eyebrow}</p>
    <h1 class="title" data-anim>${slide.title}</h1>
    <p class="text" data-anim>${slide.text}</p>
    <p class="slide__swipe" data-anim>Glisează <span>→</span></p>`,
  idea: (slide) => `
    <p class="eyebrow" data-anim>${slide.eyebrow}</p>
    <h1 class="title" data-anim>${slide.title}</h1>
    <p class="text" data-anim>${slide.text}</p>`,
  recipe: (slide) => `
    <p class="eyebrow" data-anim>${slide.eyebrow}</p>
    <h1 class="title" data-anim>${slide.title}</h1>
    <div class="recipe" data-anim>
      <h2 class="recipe__heading">Ai nevoie de</h2>
      <ul class="recipe__ingredients">${slide.ingredients.map((item) => `<li>${item}</li>`).join('')}</ul>
      <h2 class="recipe__heading">Cum se face</h2>
      <ol class="recipe__steps">${slide.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
    </div>`,
  outro: (slide, theme) => `
    <img class="slide__brand" src="imagini/${theme.logo}" alt="Fior" data-anim>
    <h1 class="title" data-anim>${slide.title}</h1>
    <p class="text" data-anim>${slide.text}</p>
    <div class="slide__actions" data-anim>
      <span><svg viewBox="0 0 24 24"><use href="#icon-save"/></svg>Salvează</span>
      <span><svg viewBox="0 0 24 24"><use href="#icon-send"/></svg>Trimite</span>
    </div>`,
};

function slideElement(carousel, slide, index, { reel = false } = {}) {
  const theme = THEMES[carousel.theme];
  const products = slide.products || [];
  const classes = [
    'banner', 'slide', `slide--${slide.type}`, `theme-${carousel.theme}`,
    theme.dark ? 'banner--dark' : '',
    products.length > 2 ? 'slide--lineup' : '',
    slide.photo ? 'slide--photo' : '',
    reel ? 'slide--reel' : '',
  ].filter(Boolean).join(' ');

  const section = document.createElement('section');
  section.className = classes;
  section.dataset.file = `carusele/${carousel.id}/${String(index + 1).padStart(2, '0')}`;
  section.innerHTML = `
    <div class="scene">${SCENES[carousel.theme]()}</div>
    ${slide.photo ? `<img class="slide__photo" src="imagini/${slide.photo}" alt="" style="object-position:${slide.photoPosition || 'center'}">` : ''}
    <header class="slide__top">
      ${slide.type === 'outro' ? '<span></span>' : `<img class="slide__logo" src="imagini/${theme.logo}" alt="Fior">`}
      <span class="slide__count">${index + 1} / ${carousel.slides.length}</span>
    </header>
    <div class="slide__body">${BODIES[slide.type](slide, theme)}</div>
    ${products.length ? productsMarkup(products) : ''}
    <p class="legal">${LEGAL}</p>`;
  return section;
}
