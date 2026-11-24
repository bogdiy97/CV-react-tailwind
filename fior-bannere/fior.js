// Shared helpers for every Fior page (bannere.html, carusele.html, reel.html).
// Load it at the end of <body>, after any script that builds slides.

// SVG sprite: gradients + gold line art in the style of the Fior labels.
const FIOR_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6e2a6"/><stop offset=".45" stop-color="#c9a55a"/><stop offset=".7" stop-color="#ecd59b"/><stop offset="1" stop-color="#8f6f2e"/>
    </linearGradient>
    <radialGradient id="g-ornament-red" cx=".35" cy=".35" r=".75">
      <stop offset="0" stop-color="#e8576a"/><stop offset=".55" stop-color="#a3182c"/><stop offset="1" stop-color="#3a0710"/>
    </radialGradient>
    <radialGradient id="g-ornament-gold" cx=".35" cy=".35" r=".75">
      <stop offset="0" stop-color="#fff3cc"/><stop offset=".5" stop-color="#c9a55a"/><stop offset="1" stop-color="#6b4f1e"/>
    </radialGradient>
    <linearGradient id="g-snow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#bccbda"/>
    </linearGradient>

    <symbol id="sparkle" viewBox="0 0 100 100">
      <path fill="currentColor" d="M50 0C53 35 65 47 100 50C65 53 53 65 50 100C47 65 35 53 0 50C35 47 47 35 50 0Z"/>
    </symbol>

    <symbol id="snowflake" viewBox="0 0 100 100">
      <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
        <path id="snowflake-arm" d="M50 50V6M50 20L39 10M50 20L61 10M50 34L42 26M50 34L58 26"/>
        <use href="#snowflake-arm" transform="rotate(60 50 50)"/>
        <use href="#snowflake-arm" transform="rotate(120 50 50)"/>
        <use href="#snowflake-arm" transform="rotate(180 50 50)"/>
        <use href="#snowflake-arm" transform="rotate(240 50 50)"/>
        <use href="#snowflake-arm" transform="rotate(300 50 50)"/>
      </g>
    </symbol>

    <symbol id="ornament" viewBox="0 0 100 130">
      <rect x="40" y="6" width="20" height="16" rx="3" fill="url(#g-gold)"/>
      <circle cx="50" cy="72" r="48" style="fill:var(--ornament-fill,url(#g-ornament-red))"/>
      <ellipse cx="34" cy="54" rx="10" ry="16" fill="#fff" opacity=".35" transform="rotate(30 34 54)"/>
    </symbol>

    <symbol id="quince-branch" viewBox="0 0 300 320">
      <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 20C80 60 140 80 200 150C230 185 250 230 262 300"/>
        <path d="M90 62C80 30 100 8 130 4C134 34 118 58 90 62Z"/><path d="M90 62C104 40 118 22 130 4"/>
        <path d="M170 120C200 100 236 104 256 124C232 146 196 146 170 120Z"/><path d="M170 120C200 118 230 122 256 124"/>
        <path d="M232 214C250 196 278 196 294 210C276 228 250 230 232 214Z"/><path d="M232 214C254 210 274 208 294 210"/>
        <path d="M150 100C148 112 146 122 140 132"/>
        <path d="M140 132C110 130 92 158 92 190C92 236 118 268 150 268C186 268 206 236 202 196C199 162 176 134 140 132Z"/>
        <path d="M146 268L140 278M150 268V280M154 268L160 278"/>
        <path d="M178 162C190 180 192 208 184 234M166 152C178 174 180 206 172 238M108 162C116 152 126 148 136 148"/>
      </g>
    </symbol>

    <symbol id="citrus" viewBox="0 0 100 100">
      <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="4"/>
        <path id="citrus-segment" d="M50 46V13"/>
        <use href="#citrus-segment" transform="rotate(45 50 50)"/><use href="#citrus-segment" transform="rotate(90 50 50)"/>
        <use href="#citrus-segment" transform="rotate(135 50 50)"/><use href="#citrus-segment" transform="rotate(180 50 50)"/>
        <use href="#citrus-segment" transform="rotate(225 50 50)"/><use href="#citrus-segment" transform="rotate(270 50 50)"/>
        <use href="#citrus-segment" transform="rotate(315 50 50)"/>
      </g>
    </symbol>

    <symbol id="cinnamon" viewBox="0 0 200 90">
      <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <g id="cinnamon-stick">
          <path d="M24 14H176M24 36H176"/>
          <path d="M176 14C184 14 186 36 176 36"/>
          <path d="M24 14C12 14 10 36 24 36C32 36 33 24 26 22C21 21 19 27 23 29"/>
          <path d="M60 25H96M118 27H150"/>
        </g>
        <use href="#cinnamon-stick" transform="translate(10 34) rotate(-5 100 25)"/>
      </g>
    </symbol>

    <symbol id="berry" viewBox="0 0 60 74">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M30 18L18 9M30 18L42 9M30 18V3M30 18L23 5M30 18L37 5"/>
        <circle cx="16" cy="26" r="7"/><circle cx="30" cy="25" r="7"/><circle cx="44" cy="26" r="7"/>
        <circle cx="10" cy="38" r="7"/><circle cx="23" cy="38" r="7"/><circle cx="37" cy="38" r="7"/><circle cx="50" cy="38" r="7"/>
        <circle cx="16" cy="50" r="7"/><circle cx="30" cy="50" r="7"/><circle cx="44" cy="50" r="7"/>
        <circle cx="23" cy="62" r="7"/><circle cx="37" cy="62" r="7"/>
      </g>
    </symbol>

    <g id="elder-blossom"><circle cx="0" cy="-4.6" r="3.6"/><circle cx="4.4" cy="-1.4" r="3.6"/><circle cx="2.7" cy="3.7" r="3.6"/><circle cx="-2.7" cy="3.7" r="3.6"/><circle cx="-4.4" cy="-1.4" r="3.6"/></g>
    <symbol id="elderflower" viewBox="0 0 160 150">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M80 148V112M80 112L44 84M80 112L64 76M80 112L96 76M80 112L116 84"/>
        <path d="M44 84L22 56M44 84L35 46M44 84L48 38M44 84L42 62"/>
        <path d="M64 76L61 33M64 76L74 30M64 76L58 52M64 76L74 47"/>
        <path d="M96 76L87 30M96 76L100 33M96 76L90 47M96 76L106 52"/>
        <path d="M116 84L113 38M116 84L126 46M116 84L139 57M116 84L122 62"/>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="1.6">
        <use href="#elder-blossom" x="22" y="56"/><use href="#elder-blossom" x="35" y="46"/><use href="#elder-blossom" x="48" y="38"/>
        <use href="#elder-blossom" x="61" y="33"/><use href="#elder-blossom" x="74" y="30"/><use href="#elder-blossom" x="87" y="30"/>
        <use href="#elder-blossom" x="100" y="33"/><use href="#elder-blossom" x="113" y="38"/><use href="#elder-blossom" x="126" y="46"/>
        <use href="#elder-blossom" x="139" y="57"/><use href="#elder-blossom" x="42" y="62"/><use href="#elder-blossom" x="58" y="52"/>
        <use href="#elder-blossom" x="74" y="47"/><use href="#elder-blossom" x="90" y="47"/><use href="#elder-blossom" x="106" y="52"/>
        <use href="#elder-blossom" x="122" y="62"/>
      </g>
    </symbol>

    <symbol id="mint" viewBox="0 0 70 110">
      <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M35 105C10 80 4 40 35 6C66 40 60 80 35 105Z"/>
        <path d="M35 105V14M35 82L20 66M35 82L50 66M35 62L22 46M35 62L48 46M35 42L27 30M35 42L43 30"/>
      </g>
    </symbol>
    <symbol id="xmas-tree" viewBox="0 0 300 420">
      <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M150 58L95 140H125L70 230H105L45 330H255L195 230H230L175 140H205Z"/>
        <path d="M136 330V372H164V330M100 380H200"/>
        <path d="M112 118Q150 140 190 116M88 200Q150 232 212 198M64 296Q150 336 236 294" stroke-dasharray="0.1 11" stroke-width="6"/>
        <circle cx="122" cy="168" r="7"/><circle cx="182" cy="176" r="7"/><circle cx="150" cy="104" r="6"/>
        <circle cx="100" cy="262" r="8"/><circle cx="160" cy="270" r="8"/><circle cx="214" cy="258" r="8"/>
      </g>
      <path fill="currentColor" d="M150 6C152 26 160 34 180 36C160 38 152 46 150 66C148 46 140 38 120 36C140 34 148 26 150 6Z"/>
    </symbol>

    <symbol id="icon-save" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6 3.5H18V21L12 16.5L6 21Z"/>
    </symbol>
    <symbol id="icon-send" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M21 3L3 10.5L10 13.5L13.5 21Z"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" d="M21 3L10 13.5"/>
    </symbol>
  </defs>
</svg>
`;

document.body.insertAdjacentHTML('afterbegin', FIOR_SPRITE);

// Seeded snowfall: looks random, but every export renders identically.
document.querySelectorAll('.snow').forEach((layer, index) => {
  let seed = 7 + index * 101;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const width = layer.offsetWidth || 1080;
  const height = layer.offsetHeight || 1080;
  const count = Number(layer.dataset.flakes || 120);
  const flakes = Array.from({ length: count }, () =>
    `<circle cx="${Math.round(rand() * width)}" cy="${Math.round(rand() * height)}" r="${(0.8 + rand() * 2.8).toFixed(1)}" fill-opacity="${(0.2 + rand() * 0.6).toFixed(2)}"/>`
  ).join('');
  layer.innerHTML = `<svg viewBox="0 0 ${width} ${height}" fill="#fff">${flakes}</svg>`;
});

// Sunlit cast shadow behind products marked .product--cast.
document.querySelectorAll('.product--cast').forEach((product) => {
  const image = product.querySelector('img');
  const shadow = image.cloneNode();
  shadow.className = 'product__cast';
  shadow.alt = '';
  product.prepend(shadow);
});
