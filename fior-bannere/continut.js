// Content for the Fior carousels and reels. Edit texts and recipes here only:
// carusele.html and reel.html are both built from this file.
//
// Slide types: cover, idea, recipe, outro.
// `products` are file names from imagini/ (without .png).

const LEGAL = 'Consumați cu responsabilitate!';

const CAROUSELS = [
  {
    id: 'dupa-job',
    theme: 'job',
    slides: [
      {
        type: 'cover',
        eyebrow: 'Seara după job',
        title: 'Închizi laptopul.<br><em>Deschizi un fior.</em>',
        text: '3 idei simple pentru serile din timpul săptămânii.',
        photo: 'foto-dupa-job.jpg',
        photoPosition: 'center top',
      },
      {
        type: 'idea',
        eyebrow: 'Ideea 1 · Cea mai rapidă',
        title: 'Hard Lemonade, <em>direct din frigider</em>',
        text: 'Desfaci, torni peste gheață și adaugi o felie de lămâie. Răcoritor, cu 5% alcool, iar trei din cele patru arome au zero zahăr.',
        products: ['hl-zmeura-lamaie', 'hl-lamaie-menta'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 2 · Rețetă',
        title: 'Gutui <em>&amp; tonic</em>',
        ingredients: ['50 ml lichior de gutui Fior', '100 ml apă tonică, rece', 'gheață', 'o felie de lămâie', 'o crenguță de rozmarin'],
        steps: ['Umple un pahar înalt cu gheață.', 'Toarnă lichiorul, apoi completează cu tonic.', 'Amestecă ușor și decorează cu lămâie și rozmarin.'],
        products: ['lichior-gutui'],
      },
      {
        type: 'idea',
        eyebrow: 'Ideea 3 · Pe balcon',
        title: 'Hugo, <em>cu mentă proaspătă</em>',
        text: 'Toarnă Elderberry Hugo rece peste gheață, într-un pahar de vin, și adaugă câteva frunze de mentă. Ușor, aromat și fără zahăr.',
        products: ['elderberry-hugo'],
      },
      {
        type: 'outro',
        title: 'Tu cum îți petreci<br><em>seara după job?</em>',
        text: 'Spune-ne în comentarii și salvează postarea pentru diseară.',
      },
    ],
  },
  {
    id: 'pe-plaja',
    theme: 'plaja',
    slides: [
      {
        type: 'cover',
        eyebrow: 'Pe plajă',
        title: 'Soare, nisip<br><em>și un fior.</em>',
        text: 'Ce pui în geanta frigorifică vara asta.',
        photo: 'foto-plaja.jpg',
        photoPosition: 'center 30%',
      },
      {
        type: 'idea',
        eyebrow: 'Ideea 1 · În geanta frigorifică',
        title: 'Hard Lemonade, <em>bine răcit</em>',
        text: 'Patru arome pentru plajă: lămâie verde și ghimbir, zmeură, lămâie și mentă, soc. Sunt cele mai bune la 4–6 °C.',
        products: ['hl-lamaie-verde-ghimbir', 'hl-zmeura-lamaie', 'hl-lamaie-menta', 'hl-soc-lamaie'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 2 · Rețetă',
        title: 'Sangria <em>slush</em>',
        ingredients: ['300 ml Berry Sangria, congelată cuburi', '100 g fructe de pădure congelate', 'câteva frunze de mentă'],
        steps: ['Congelează Berry Sangria în tăvița de gheață, minimum 6 ore.', 'Mixează scurt cuburile cu fructele, până se face granita.', 'Servește imediat, cu mentă deasupra.'],
        products: ['berry-sangria'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 3 · Rețetă',
        title: 'Hugo <em>spritz</em>',
        ingredients: ['150 ml Elderberry Hugo, rece', '50 ml apă minerală', 'gheață', 'felii de lime și mentă'],
        steps: ['Pune gheață într-un pahar mare de vin.', 'Toarnă Hugo, apoi apa minerală.', 'Adaugă lime și mentă și amestecă ușor.'],
        products: ['elderberry-hugo'],
      },
      {
        type: 'outro',
        title: 'Salvează postarea<br><em>pentru prima zi de plajă.</em>',
        text: 'Și nu uita de apă, de umbră și de consumul cu responsabilitate.',
      },
    ],
  },
  {
    id: 'la-ski',
    theme: 'ski',
    slides: [
      {
        type: 'cover',
        eyebrow: 'După pârtie',
        title: 'Après-ski<br><em>cu un fior.</em>',
        text: '3 idei calde pentru când îți scoți clăparii.',
        products: ['lichior-gutui', 'berry-sangria'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 1 · Rețetă',
        title: 'Ceai fierbinte <em>cu gutui</em>',
        ingredients: ['200 ml ceai negru, fierbinte', '40 ml lichior de gutui Fior', 'o felie de lămâie', 'un baton de scorțișoară', 'miere, după gust'],
        steps: ['Pregătește ceaiul și lasă-l un minut să se tempereze.', 'Adaugă lichiorul, lămâia și scorțișoara.', 'Îndulcește cu miere, dacă vrei.'],
        products: ['lichior-gutui'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 2 · Rețetă pentru 4 căni',
        title: 'Berry Sangria <em>caldă</em>',
        ingredients: ['750 ml Berry Sangria', 'o portocală, feliată', '2 batoane de scorțișoară', '3 cuișoare', 'o steluță de anason'],
        steps: ['Pune totul într-o oală, la foc mic.', 'Încălzește 10 minute, fără să dea în clocot.', 'Servește în căni, cu o felie de portocală.'],
        products: ['berry-sangria'],
      },
      {
        type: 'idea',
        eyebrow: 'Ideea 3 · Lângă șemineu',
        title: 'Lichior de gutui, <em>simplu</em>',
        text: 'Un pahar mic, la temperatura camerei. Cald, catifelat și auriu, exact ce-ți trebuie după o zi pe pârtie.',
        products: ['lichior-gutui'],
      },
      {
        type: 'outro',
        title: 'Mai întâi pârtia,<br><em>apoi paharul.</em>',
        text: 'Ne vedem la après-ski. Salvează postarea pentru vacanța la munte.',
      },
    ],
  },
  {
    id: 'langa-brad',
    theme: 'brad',
    slides: [
      {
        type: 'cover',
        eyebrow: 'Lângă pomul de Crăciun',
        title: 'Seara în care<br><em>împodobim bradul.</em>',
        text: '3 idei Fior pentru serile de decembrie.',
        products: ['lichior-gutui'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 1 · Rețetă',
        title: 'Fior <em>de Crăciun</em>',
        ingredients: ['40 ml lichior de gutui Fior', '20 ml suc proaspăt de portocale', '100 ml prosecco, rece', 'un praf de scorțișoară'],
        steps: ['Toarnă lichiorul și sucul într-un pahar flute.', 'Completează încet cu prosecco.', 'Presară scorțișoară deasupra.'],
        products: ['lichior-gutui'],
      },
      {
        type: 'recipe',
        eyebrow: 'Ideea 2 · Rețetă pentru 6–8 pahare',
        title: 'Punch-ul <em>de sărbători</em>',
        ingredients: ['750 ml Berry Sangria', '250 ml suc de portocale', '250 ml apă minerală', 'felii de portocală și boabe de rodie', 'gheață'],
        steps: ['Amestecă Sangria și sucul într-un bol mare.', 'Adaugă apa minerală chiar înainte de servire.', 'Pune fructele și gheața.'],
        products: ['berry-sangria'],
      },
      {
        type: 'idea',
        eyebrow: 'Ideea 3 · Desertul',
        title: 'Înghețată <em>cu gutui</em>',
        text: 'O cupă de înghețată de vanilie, o lingură de lichior de gutui turnată deasupra și câteva nuci caramelizate. Desert de Crăciun în două minute.',
        products: ['lichior-gutui'],
      },
      {
        type: 'outro',
        title: 'Crăciun <em>fericit!</em>',
        text: 'Ce pui tu în pahar lângă brad? Spune-ne în comentarii.',
      },
    ],
  },
  {
    id: 'retete',
    theme: 'retete',
    slides: [
      {
        type: 'cover',
        eyebrow: 'Rețete Fior',
        title: '4 cocktailuri<br><em>gata în 3 minute.</em>',
        text: 'Le faci acasă, cu ce ai deja în bucătărie.',
        products: ['hl-lamaie-verde-ghimbir', 'berry-sangria', 'lichior-gutui', 'elderberry-hugo'],
      },
      {
        type: 'recipe',
        eyebrow: 'Rețeta 1',
        title: 'Gutui <em>sour</em>',
        ingredients: ['50 ml lichior de gutui Fior', '25 ml suc proaspăt de lămâie', '1 albuș, opțional, pentru spumă', 'gheață'],
        steps: ['Pune totul în shaker, cu gheață.', 'Agită energic 15 secunde.', 'Strecoară într-un pahar coupe.'],
        products: ['lichior-gutui'],
      },
      {
        type: 'recipe',
        eyebrow: 'Rețeta 2',
        title: 'Sangria <em>royale</em>',
        ingredients: ['100 ml Berry Sangria, rece', '50 ml prosecco, rece', 'câteva fructe de pădure', 'o felie de portocală'],
        steps: ['Pune fructele într-un pahar de vin.', 'Toarnă Sangria, apoi prosecco.', 'Decorează cu felia de portocală.'],
        products: ['berry-sangria'],
      },
      {
        type: 'recipe',
        eyebrow: 'Rețeta 3',
        title: 'Hugo <em>smash</em>',
        ingredients: ['150 ml Elderberry Hugo, rece', '4–5 frunze de mentă', '2 felii de lime', 'gheață pisată'],
        steps: ['Zdrobește ușor menta și lime-ul în pahar.', 'Umple paharul cu gheață pisată.', 'Toarnă Hugo și amestecă.'],
        products: ['elderberry-hugo'],
      },
      {
        type: 'recipe',
        eyebrow: 'Rețeta 4',
        title: 'Ginger <em>lemonade</em>',
        ingredients: ['1 Hard Lemonade Lămâie verde și ghimbir, rece', '2 felii subțiri de ghimbir proaspăt', 'o felie de lime', 'gheață'],
        steps: ['Pune gheața și ghimbirul într-un pahar înalt.', 'Toarnă Hard Lemonade.', 'Adaugă lime-ul și amestecă ușor.'],
        products: ['hl-lamaie-verde-ghimbir'],
      },
      {
        type: 'outro',
        title: 'Pe care o încerci<br><em>prima?</em>',
        text: 'Salvează postarea și trimite-o cuiva cu care vrei să le gustați împreună.',
      },
    ],
  },
];
