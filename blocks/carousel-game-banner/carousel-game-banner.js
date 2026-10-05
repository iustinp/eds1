import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * carousel-game-banner
 * Image-only promotional slider: one wide slide visible at a time, cross-fade transition,
 * dot indicators below, auto-rotation (paused on hover/focus and for reduced motion).
 *
 * Content contract (one row per slide):
 *   cell 1: banner image (optionally wrapped in a link)
 *   cell 2: optional text overlay (heading / text / CTA) — usually empty
 */

// No authorable options yet; kept so option branches can be added without restructuring.
const OPTION_CLASSES = [];
const ROTATE_INTERVAL = 6000;
// Static labels: the project has no placeholders sheet (fetching it 404s on every page).
const LABELS = {
  roleDescription: 'Carousel',
  slide: 'Slide',
  controls: 'Carousel Slide Controls',
  showSlide: 'Show Slide',
  of: 'of',
};

let instanceId = 0;

function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-game-banner-slide')];
  if (!slides.length) return;
  const count = slides.length;
  const active = ((index % count) + count) % count;
  block.dataset.activeSlide = active;

  slides.forEach((slide, i) => {
    const isActive = i === active;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    if (isActive) slide.removeAttribute('inert');
    else slide.setAttribute('inert', '');
  });

  block.querySelectorAll('.carousel-game-banner-indicator button').forEach((button, i) => {
    if (i === active) {
      button.setAttribute('aria-current', 'true');
      button.disabled = true;
    } else {
      button.removeAttribute('aria-current');
      button.disabled = false;
    }
  });
}

function createSlide(row, index, id, total) {
  const slide = document.createElement('li');
  slide.className = 'carousel-game-banner-slide';
  slide.id = `carousel-game-banner-${id}-slide-${index}`;
  slide.dataset.slideIndex = index;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img')) || cells[0];
  const contentCells = cells.filter((c) => c !== imageCell);

  if (imageCell) {
    imageCell.className = 'carousel-game-banner-slide-image';
    imageCell.querySelectorAll('picture > img, :scope > img, a > img').forEach((img) => {
      // external images can't go through the media optimizer (it drops the origin)
      if (new URL(img.src).origin !== window.location.origin) return;
      const target = img.closest('picture') || img;
      target.replaceWith(createOptimizedPicture(img.src, img.alt || '', index === 0, [
        { media: '(min-width: 900px)', width: '1400' },
        { width: '750' },
      ]));
    });
    slide.append(imageCell);
  }

  const content = contentCells.find((c) => c.textContent.trim() || c.querySelector('a'));
  if (content) {
    content.className = 'carousel-game-banner-slide-content';
    slide.append(content);
  }

  const label = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (label && label.id) slide.setAttribute('aria-labelledby', label.id);
  else {
    // banner images are usually decorative (alt=""), so fall back to the slide position
    const alt = slide.querySelector('img')?.alt;
    slide.setAttribute('aria-label', alt || `${LABELS.slide} ${index + 1} ${LABELS.of} ${total}`);
  }
  return slide;
}

function bindEvents(block) {
  const step = (delta) => showSlide(block, parseInt(block.dataset.activeSlide, 10) + delta);

  block.querySelectorAll('.carousel-game-banner-indicator button').forEach((button, i) => {
    button.addEventListener('click', () => showSlide(block, i));
  });

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // Basic swipe support for touch devices.
  let startX = null;
  block.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  block.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    startX = null;
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer;
  const start = () => {
    clearInterval(timer);
    timer = setInterval(() => step(1), ROTATE_INTERVAL);
  };
  const stop = () => clearInterval(timer);
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  start();
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  active.forEach((option) => block.classList.add(`carousel-game-banner-${option}`));

  instanceId += 1;
  const id = instanceId;
  const rows = [...block.children]
    .filter((row) => row.querySelector('picture, img') || row.textContent.trim());

  block.id = `carousel-game-banner-${id}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', LABELS.roleDescription);

  const viewport = document.createElement('div');
  viewport.className = 'carousel-game-banner-viewport';
  const slides = document.createElement('ul');
  slides.className = 'carousel-game-banner-slides';
  rows.forEach((row, i) => slides.append(createSlide(row, i, id, rows.length)));
  viewport.append(slides);

  block.replaceChildren(viewport);

  if (rows.length > 1) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', LABELS.controls);
    const indicators = document.createElement('ol');
    indicators.className = 'carousel-game-banner-indicators';
    rows.forEach((_, i) => {
      const item = document.createElement('li');
      item.className = 'carousel-game-banner-indicator';
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-controls', `carousel-game-banner-${id}-slide-${i}`);
      button.setAttribute('aria-label', `${LABELS.showSlide} ${i + 1} ${LABELS.of} ${rows.length}`);
      item.append(button);
      indicators.append(item);
    });
    nav.append(indicators);
    block.append(nav);
  }

  showSlide(block, 0);
  if (rows.length > 1) bindEvents(block);
}
