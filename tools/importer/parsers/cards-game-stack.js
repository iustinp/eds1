/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-game-stack. Base: cards.
 * Source: https://www.playinjector.com/ (#homeGamesList)
 *
 * Output: one row per div.game-box
 *   cell 1: cover / logo image
 *   cell 2: title (h3), rating text ("3 stars"), price, platforms text, CTA link
 * The order of cell 2 matches parseBody() in blocks/cards-game-stack/cards-game-stack.js.
 */
const PLATFORM_NAMES = {
  windows: 'Windows',
  apple: 'Mac',
  mac: 'Mac',
  linux: 'Linux',
  steam: 'Steam',
  drm: 'DRM-free',
  english: 'English',
  french: 'French',
  german: 'German',
};

function platformName(icon) {
  const title = (icon.getAttribute('title') || '').trim();
  if (title) return title;
  const cls = [...icon.classList].find((c) => c.startsWith('sprite-'));
  if (!cls) return '';
  const key = cls.replace('sprite-', '');
  return PLATFORM_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function p(document, text) {
  const el = document.createElement('p');
  el.textContent = text;
  return el;
}

export default function parse(element, { document }) {
  // div.game-box is a plain block-level div (iterationSafe per structure.json).
  const boxes = [...element.querySelectorAll(':scope > .game-box, :scope > div > .game-box')];
  const cells = [];

  boxes.forEach((box) => {
    // Title: regular game card or full-width promo card.
    const titleEl = box.querySelector('.game-box-title, .game-box-title-full');
    const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';

    // Image: cover image (alt="cover") or promo logo; skip overlay/time-bar/bottom logos.
    const img = box.querySelector('.game-box-image img[alt="cover"]')
      || box.querySelector('.game-box-image img:last-of-type')
      || box.querySelector('.game-box-image-full img');

    const body = [];
    if (titleText) {
      const h = document.createElement('h3');
      h.textContent = titleText;
      body.push(h);
    }

    const quality = box.querySelector('.game-box-quality [title], .game-box-quality .quality');
    const rating = quality ? (quality.getAttribute('title') || quality.textContent).trim() : '';
    if (rating) body.push(p(document, rating));

    const priceEl = box.querySelector('.game-box-price-no-discount, .game-box-price');
    const price = priceEl ? priceEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (price) body.push(p(document, price));

    const platforms = [...box.querySelectorAll('.game-box-right .sprite')]
      .map(platformName)
      .filter(Boolean);
    if (platforms.length) body.push(p(document, platforms.join(', ')));

    // CTA: real link on promo cards; JS "Buy!" button on game cards (no href in source).
    const link = box.querySelector('a.green-button, a.green-button-gs, .game-box-bottom a[href]');
    const button = box.querySelector('button.game-box-buy, .game-box-buy');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent.trim();
      const wrap = document.createElement('p');
      wrap.append(a);
      body.push(wrap);
    } else if (button && button.textContent.trim()) {
      const a = document.createElement('a');
      a.href = 'https://www.playinjector.com/';
      a.textContent = button.textContent.trim();
      const wrap = document.createElement('p');
      wrap.append(a);
      body.push(wrap);
    }

    if (!img && !body.length) return;
    cells.push([img || '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-game-stack', cells });
  element.replaceWith(block);
}
