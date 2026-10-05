import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-game-stack
 * A cascading pile of game cards: one card is fully visible, the next cards peek out
 * behind it (title bars only). The pile rotates automatically and on click / arrow keys.
 *
 * Content contract (one row per card):
 *   cell 1: cover image
 *   cell 2: title (heading), rating text ("3 stars"), price, platforms text, CTA link
 */

// No authorable options yet; kept so option branches can be added without restructuring.
const OPTION_CLASSES = [];
const MAX_STARS = 3;
const PEEK_DEPTH = 2;
const ROTATE_INTERVAL = 5000;

const RATING_RE = /^(\d+(?:[.,]\d+)?)\s*(?:\/\s*\d+\s*)?stars?$/i;
const PRICE_RE = /^(?:[$€£]\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?[$€£]|free)$/i;

function buildRating(text) {
  const match = text.trim().match(RATING_RE);
  const value = match ? Math.min(MAX_STARS, Math.round(parseFloat(match[1].replace(',', '.')))) : 0;
  const rating = document.createElement('div');
  rating.className = 'cards-game-stack-card-rating';
  rating.dataset.rating = value;
  rating.setAttribute('role', 'img');
  rating.setAttribute('aria-label', text.trim());
  for (let i = 0; i < MAX_STARS; i += 1) {
    const star = document.createElement('span');
    star.className = i < value ? 'cards-game-stack-star is-filled' : 'cards-game-stack-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = i < value ? '★' : '☆';
    rating.append(star);
  }
  return rating;
}

function buildPlatforms(text) {
  const list = document.createElement('ul');
  list.className = 'cards-game-stack-card-platforms';
  text.split(/[,|/]/).map((t) => t.trim()).filter(Boolean).forEach((name) => {
    const item = document.createElement('li');
    item.className = `cards-game-stack-platform platform-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    item.textContent = name;
    list.append(item);
  });
  return list;
}

/** Sorts the body cell's children into the card's named slots. */
function parseBody(cell) {
  const slots = {
    title: null, rating: null, price: null, cta: null, platforms: null, extra: [],
  };
  if (!cell) return slots;

  const children = [...cell.children];
  // Bare text in the cell (no block elements): treat it as the title.
  if (!children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = cell.textContent.trim();
    children.push(p);
  }

  children.forEach((el) => {
    const text = el.textContent.trim();
    if (!text && !el.querySelector('a, picture, img')) return; // drop empty spacers
    if (!slots.title && /^H[1-6]$/.test(el.tagName)) slots.title = el;
    else if (!slots.rating && RATING_RE.test(text)) slots.rating = buildRating(text);
    else if (!slots.cta && el.querySelector('a')) slots.cta = el;
    else if (!slots.price && PRICE_RE.test(text)) slots.price = el;
    else if (!slots.title) slots.title = el;
    else if (!slots.platforms) slots.platforms = buildPlatforms(text);
    else slots.extra.push(el);
  });
  return slots;
}

function buildCard(row, index) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const bodyCell = cells.find((c) => c !== imageCell);
  const slots = parseBody(bodyCell);

  const card = document.createElement('li');
  card.className = 'cards-game-stack-card';
  card.dataset.index = index;

  const top = document.createElement('div');
  top.className = 'cards-game-stack-card-top';
  if (slots.title) {
    slots.title.classList.add('cards-game-stack-card-title');
    top.append(slots.title);
  }
  if (slots.rating) top.append(slots.rating);
  card.append(top);

  if (imageCell) {
    const media = document.createElement('div');
    media.className = 'cards-game-stack-card-image';
    const img = imageCell.querySelector('img');
    if (img) {
      // external images can't go through the media optimizer (it drops the origin)
      media.append(new URL(img.src).origin === window.location.origin
        ? createOptimizedPicture(img.src, img.alt || '', false, [{ width: '400' }])
        : img.closest('picture') || img);
    }
    card.append(media);
  }

  if (slots.price) {
    slots.price.classList.add('cards-game-stack-card-price');
    card.append(slots.price);
  }
  if (slots.cta) {
    slots.cta.classList.add('cards-game-stack-card-cta');
    card.append(slots.cta);
  }
  if (slots.platforms) card.append(slots.platforms);
  slots.extra.forEach((el) => {
    el.classList.add('cards-game-stack-card-extra');
    card.append(el);
  });
  return card;
}

function setActive(block, nextIndex) {
  const cards = [...block.querySelectorAll('.cards-game-stack-card')];
  const count = cards.length;
  const active = ((nextIndex % count) + count) % count;
  block.dataset.activeCard = active;

  cards.forEach((card, i) => {
    const depth = (i - active + count) % count;
    card.style.setProperty('--stack-depth', depth);
    card.style.zIndex = count - depth;
    card.classList.toggle('is-active', depth === 0);
    card.classList.toggle('is-peeking', depth > 0 && depth <= PEEK_DEPTH);
    card.classList.toggle('is-hidden', depth > PEEK_DEPTH);
    card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
    if (depth === 0) card.removeAttribute('inert');
    else card.setAttribute('inert', '');
  });
}

function bindStack(block, list) {
  const step = (delta) => setActive(block, parseInt(block.dataset.activeCard, 10) + delta);

  // Peeking cards are inert (also skipped by hit-testing), so clicks land on the list
  // and the peeking card under the pointer is resolved from its position.
  list.addEventListener('click', (e) => {
    if (e.target.closest('.cards-game-stack-card.is-active')) return;
    const card = [...list.querySelectorAll('.cards-game-stack-card.is-peeking')]
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right
          && e.clientY >= r.top && e.clientY <= r.bottom;
      })
      .sort((a, b) => b.style.zIndex - a.style.zIndex)[0];
    if (card) {
      e.preventDefault();
      setActive(block, parseInt(card.dataset.index, 10));
    }
  });

  block.tabIndex = 0;
  block.addEventListener('keydown', (e) => {
    if (e.target !== block) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
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
  active.forEach((option) => block.classList.add(`cards-game-stack-${option}`));

  const list = document.createElement('ul');
  list.className = 'cards-game-stack-list';
  [...block.children]
    .filter((row) => row.textContent.trim() || row.querySelector('picture, img'))
    .forEach((row, i) => list.append(buildCard(row, i)));

  block.replaceChildren(list);
  const count = list.children.length;
  if (!count) return;

  block.style.setProperty('--stack-peek-count', Math.min(PEEK_DEPTH, count - 1));
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured games');
  setActive(block, 0);
  if (count > 1) bindStack(block, list);
}
