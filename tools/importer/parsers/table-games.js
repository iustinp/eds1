/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-games. Base: table.
 * Source: https://www.playinjector.com/ (#content > div.centerwrap .games-presentation)
 *
 * Output (6 columns):
 *   header: Image | Game | Discount | Rating | Platforms | Price
 *   one row per visible game <tr> (hidden tr.game-details-* rows are skipped):
 *     thumbnail | title + "Release date: ..." | discount | "3 stars" | "Windows, Steam, English" | "BUY: $39.99"
 * The "Load more" button and the hidden long descriptions/galleries are omitted.
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

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function p(document, text) {
  const el = document.createElement('p');
  el.textContent = text;
  return el;
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table#games-container, table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Visible game rows: those with a title cell; tr.game-details-* (hidden details) excluded.
  const rows = [...table.querySelectorAll('tr')].filter((tr) => !/(^|\s)game-details-/.test(tr.className)
    && !tr.classList.contains('hide')
    && tr.querySelector('.game-list-title, .game-name'));

  const cells = [['Image', 'Game', 'Discount', 'Rating', 'Platforms', 'Price', 'Description']];

  rows.forEach((tr) => {
    const tds = [...tr.querySelectorAll(':scope > td')];

    const img = tr.querySelector('.game-list-image img') || (tds[0] && tds[0].querySelector('img'));

    const titleTd = tr.querySelector('.game-list-title') || tds[1];
    const game = [];
    const name = clean(titleTd?.querySelector('.game-name')?.textContent);
    const desc = clean(titleTd?.querySelector('.game-description')?.textContent);
    if (name) game.push(p(document, name));
    if (desc) game.push(p(document, desc));
    if (!game.length && titleTd) game.push(clean(titleTd.textContent));

    // Discount column has no specific class: 3rd cell.
    const discount = clean(tds[2]?.textContent) || '-';

    const quality = tr.querySelector('.game-quality .quality, .game-quality [title]');
    const rating = quality ? clean(quality.getAttribute('title') || quality.textContent) : '';

    const platforms = [...tr.querySelectorAll('.game-icons .sprite')]
      .map(platformName)
      .filter(Boolean)
      .join(', ');

    const priceTd = tr.querySelector('.game-list-price') || tds[5];
    const price = clean(priceTd?.textContent);

    // Long description lives in the following hidden <tr class="game-details-{id} hide">
    // (.game-list-description > p). Empty &nbsp; spacer paragraphs are dropped; the
    // screenshot gallery (.game-list-gallery) is not carried over.
    const details = tr.nextElementSibling;
    const description = [];
    if (details && /(^|\s)game-details-/.test(details.className)) {
      details.querySelectorAll('.game-list-description p').forEach((para) => {
        // some descriptions are a single <p> with <br><br> breaks: split those into paragraphs
        const segments = [''];
        para.childNodes.forEach((node) => {
          if (node.nodeName === 'BR') segments.push('');
          else segments[segments.length - 1] += node.textContent;
        });
        segments.forEach((segment) => {
          const text = clean(segment.replace(/\u00a0/g, ' '));
          if (text) description.push(p(document, text));
        });
      });
    }

    cells.push([img || '', game, discount, rating, platforms, price, description]);
  });

  if (cells.length === 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-games', cells });
  element.replaceWith(block);
}
