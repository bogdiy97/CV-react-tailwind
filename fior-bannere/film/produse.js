// The five product videos (film-produs.html?p=<id>): one per Fior drink line, plus the whole range.
// Texts come from the labels and fiordrinks.ro. Colours: liquid = the molten intro, stage = backdrop,
// glow and light rays. `beats` are four pairs of cuts on the drop: an ingredient card, then a visual.

const PALETTES = {
  gold: { deep: [0.16, 0.07, 0.015], mid: [0.9, 0.6, 0.22], shine: [1.0, 0.88, 0.62], rimTint: [0.8, 0.5, 0.18] },
  wine: { deep: [0.1, 0.005, 0.02], mid: [0.58, 0.05, 0.11], shine: [1.0, 0.6, 0.6], rimTint: [0.7, 0.12, 0.16] },
  elder: { deep: [0.05, 0.08, 0.015], mid: [0.68, 0.76, 0.32], shine: [1.0, 1.0, 0.85], rimTint: [0.5, 0.65, 0.2] },
  lemon: { deep: [0.16, 0.11, 0.01], mid: [0.95, 0.78, 0.2], shine: [1.0, 1.0, 0.8], rimTint: [0.85, 0.7, 0.15] },
};

const STAGES = {
  gutui: { base: [0.03, 0.01, 0.003], glow: [0.36, 0.14, 0.04], ray: [1.0, 0.68, 0.32] },
  sangria: { base: [0.04, 0.003, 0.01], glow: [0.4, 0.04, 0.09], ray: [1.0, 0.35, 0.4] },
  hugo: { base: [0.01, 0.025, 0.005], glow: [0.18, 0.3, 0.06], ray: [0.85, 1.0, 0.5] },
  lemon: { base: [0.03, 0.022, 0.003], glow: [0.34, 0.25, 0.04], ray: [1.0, 0.85, 0.4] },
};

const HL_ALL = ['hlGhimbir', 'hlZmeura', 'hlMenta', 'hlSoc'];

const PRODUCT_FILMS = {
  gutui: {
    relief: 'Gutui',
    liquid: PALETTES.gold,
    stage: STAGES.gutui,
    bottles: ['gutui'],
    eyebrow: 'LICHIOR DE GUTUI',
    title: ['Aurul toamnei', 'târzii.'],
    line: 'Nefiltrat  ·  fără arome adăugate',
    floatingIcons: ['quince-branch'],
    photo: { image: 'fotoGutui', words: ['Gust tandru', 'și delicat.'], small: 'DIN GUTUI ROMÂNEȘTI' },
    beats: [
      [{ icon: 'quince-branch', word: 'Gutui', sub: 'românești' }, { bottles: ['gutui'], label: 'LICHIOR DE GUTUI' }],
      [{ icon: 'sparkle', word: 'Nefiltrat' }, { photo: 'fotoGutui', label: 'GUST TANDRU ȘI DELICAT' }],
      [{ icon: 'quince-branch', word: 'Fără arome', sub: 'adăugate' }, { bottles: ['gutui'], label: 'METODE ARTIZANALE' }],
      [{ icon: 'sparkle', word: 'Fără coloranți' }, { photo: 'fotoGutui', label: 'FIECARE DETALIU CONTEAZĂ' }],
    ],
    finale: { name: 'Lichior de gutui', tagline: 'Fiecare detaliu contează.' },
  },
  sangria: {
    relief: 'Sangria',
    liquid: PALETTES.wine,
    stage: STAGES.sangria,
    bottles: ['sangria'],
    eyebrow: 'COCKTAIL READY TO DRINK',
    title: ['Berry', 'Sangria.'],
    line: 'Zero zahăr  ·  750 ml',
    floatingIcons: ['berry', 'citrus', 'cinnamon'],
    photo: { image: 'fotoSangria', words: ['Roșul', 'serilor lungi.'], small: 'BERRY SANGRIA' },
    beats: [
      [{ icon: 'berry', word: 'Zmeură' }, { bottles: ['sangria'], label: 'BERRY SANGRIA' }],
      [{ icon: 'berry', word: 'Mure' }, { photo: 'fotoSangria', label: 'COCKTAIL READY TO DRINK' }],
      [{ icon: 'citrus', word: 'Portocală' }, { bottles: ['sangria'], label: 'ZERO ZAHĂR' }],
      [{ icon: 'cinnamon', word: 'Scorțișoară' }, { photo: 'fotoSangria', label: 'BERRY SANGRIA' }],
    ],
    finale: { name: 'Berry Sangria', tagline: 'Zmeură, mure, portocală și scorțișoară.' },
  },
  hugo: {
    relief: 'Hugo',
    liquid: PALETTES.elder,
    stage: STAGES.hugo,
    bottles: ['hugo'],
    sparkling: true,
    eyebrow: 'COCKTAIL READY TO DRINK',
    title: ['Elderberry', 'Hugo.'],
    line: 'Zero zahăr  ·  750 ml',
    floatingIcons: ['elderflower', 'citrus', 'mint'],
    photo: { image: 'fotoHugo', words: ['Răcoros.', 'Ușor.'], small: 'ELDERBERRY HUGO' },
    beats: [
      [{ icon: 'elderflower', word: 'Flori de soc' }, { bottles: ['hugo'], label: 'ELDERBERRY HUGO' }],
      [{ icon: 'citrus', word: 'Lămâie' }, { photo: 'fotoHugo', label: 'COCKTAIL READY TO DRINK' }],
      [{ icon: 'mint', word: 'Mentă' }, { bottles: ['hugo'], label: 'ELDERBERRY HUGO' }],
      [{ icon: 'sparkle', word: 'Zero zahăr' }, { photo: 'fotoHugo', label: 'RĂCOROS ȘI UȘOR' }],
    ],
    finale: { name: 'Elderberry Hugo', tagline: 'Flori de soc, lămâie și mentă.' },
  },
  'hard-lemonade': {
    relief: 'Lemonade',
    liquid: PALETTES.lemon,
    stage: STAGES.lemon,
    bottles: HL_ALL,
    sparkling: true,
    eyebrow: 'HARD LEMONADE',
    title: ['Patru arome.', 'Un singur fior.'],
    line: '5% alcool  ·  trei arome zero zahăr',
    floatingIcons: ['citrus', 'berry', 'mint', 'elderflower'],
    photo: { image: 'fotoJob', band: true, words: ['Seara', 'după job.'], small: 'HARD LEMONADE' },
    beats: [
      [{ icon: 'citrus', word: 'Lămâie verde', sub: 'și ghimbir' }, { bottles: ['hlGhimbir'], label: 'ZERO ZAHĂR' }],
      [{ icon: 'berry', word: 'Zmeură', sub: 'și lămâie' }, { bottles: ['hlZmeura'], label: 'ZERO ZAHĂR' }],
      [{ icon: 'mint', word: 'Lămâie', sub: 'și mentă' }, { bottles: ['hlMenta'], label: 'ZERO ZAHĂR' }],
      [{ icon: 'elderflower', word: 'Soc', sub: 'și lămâie' }, { bottles: ['hlSoc'], label: 'HARD LEMONADE' }],
    ],
    finale: { name: 'Hard Lemonade', tagline: 'Patru arome. Un singur fior.' },
  },
  gama: {
    relief: null, // the Fior logo rises out of the gold
    liquid: PALETTES.gold,
    stage: STAGES.gutui,
    bottles: ['hlZmeura', 'sangria', 'gutui', 'hugo', 'hlMenta'],
    eyebrow: 'FIOR',
    title: ['Singur sau', 'împreună.'],
    line: 'Lichior  ·  Cocktails  ·  Hard Lemonade',
    floatingIcons: ['quince-branch', 'berry', 'elderflower', 'citrus'],
    photo: { image: 'fotoPlaja', words: ['Vara,', 'la apus.'], small: 'HARD LEMONADE ZMEURĂ ȘI LĂMÂIE' },
    beats: [
      [{ icon: 'quince-branch', word: 'Lichior', sub: 'de gutui' }, { bottles: ['gutui'], stage: STAGES.gutui, label: 'NEFILTRAT' }],
      [{ icon: 'berry', word: 'Berry', sub: 'Sangria' }, { bottles: ['sangria'], stage: STAGES.sangria, label: 'COCKTAIL READY TO DRINK' }],
      [{ icon: 'elderflower', word: 'Elderberry', sub: 'Hugo' }, { bottles: ['hugo'], stage: STAGES.hugo, label: 'COCKTAIL READY TO DRINK' }],
      [{ icon: 'citrus', word: 'Hard', sub: 'Lemonade' }, { bottles: HL_ALL, stage: STAGES.lemon, label: 'PATRU AROME' }],
    ],
    finale: { name: null, tagline: 'Fiecare detaliu contează.' }, // null: particles form the logo
  },
};
