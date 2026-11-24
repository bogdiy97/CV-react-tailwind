// Turns one carousel (reel.html?c=<id>) into a 1080×1920 reel, one slide per scene.
// window.renderFrame(t) draws the frame at t seconds; render-reels.cjs captures every frame.

const SCENE_SECONDS = { cover: 3.2, idea: 4.4, recipe: 6.5, outro: 3.6 };
const CROSSFADE = 0.5;
const END_HOLD = 0.5;
const SNOW_SPEED = 45; // px per second

const carouselId = new URLSearchParams(location.search).get('c') || CAROUSELS[0].id;
const carousel = CAROUSELS.find((item) => item.id === carouselId);
const stage = document.getElementById('stage');

let clock = 0;
const scenes = carousel.slides.map((slide, index) => {
  const element = slideElement(carousel, slide, index, { reel: true });
  stage.append(element);
  const scene = {
    element,
    start: clock,
    duration: SCENE_SECONDS[slide.type],
    parts: [...element.querySelectorAll('[data-anim]')],
    photo: element.querySelector('.slide__photo'),
  };
  clock += scene.duration;
  return scene;
});

window.REEL_DURATION = clock + END_HOLD;

const clamp = (value) => Math.min(1, Math.max(0, value));
const easeOut = (value) => 1 - (1 - value) ** 3;

// Snow loops seamlessly: every flake gets a copy one screen higher, then the layer slides down.
function prepareSnowLoops() {
  document.querySelectorAll('#stage .snow svg').forEach((svg) => {
    const height = svg.viewBox.baseVal.height;
    svg.querySelectorAll('circle').forEach((flake) => {
      const copy = flake.cloneNode();
      copy.setAttribute('cy', Number(flake.getAttribute('cy')) - height);
      svg.append(copy);
    });
    svg.style.overflow = 'visible';
    svg.dataset.loop = height;
  });
}

let snowReady = false;

window.renderFrame = (t) => {
  if (!snowReady) {
    prepareSnowLoops();
    snowReady = true;
  }

  scenes.forEach((scene, index) => {
    const local = t - scene.start;
    const next = scenes[index + 1];
    const visible = local >= 0 && (!next || t < next.start + CROSSFADE);
    scene.element.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;

    scene.element.style.opacity = index === 0 ? 1 : easeOut(clamp(local / CROSSFADE));

    scene.parts.forEach((part, order) => {
      const isProduct = part.dataset.anim === 'rise';
      const delay = isProduct ? 0.15 : 0.25 + order * 0.18;
      const progress = easeOut(clamp((local - delay) / 0.7));
      part.style.opacity = progress;
      part.style.transform = `translateY(${(1 - progress) * (isProduct ? 140 : 36)}px)`;
    });

    if (scene.photo) {
      scene.photo.style.transform = `scale(${1.1 - 0.1 * clamp(local / scene.duration)})`;
    }

    scene.element.querySelectorAll('.snow svg').forEach((svg) => {
      svg.style.transform = `translateY(${(t * SNOW_SPEED) % Number(svg.dataset.loop)}px)`;
    });
  });
};
