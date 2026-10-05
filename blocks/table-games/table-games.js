import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * table-games
 * Games catalog rendered as a semantic table, with a client-side toolbar (search + sort)
 * and a "Load more" control. The toolbar is generated here — it is not authored content.
 *
 * Content contract:
 *   row 1 (header): Image | Game | Discount | Rating | Platforms | Price | Description
 *   rows 2..n: thumbnail | title + "Release date: ..." | discount | "3 stars" |
 *              "Windows, Steam" | "BUY: $39.99" | description paragraphs
 * Columns are recognised by header label, so authors may reorder, add or omit columns.
 *
 * The Description column is never rendered as a column: each game becomes its own <tbody>
 * holding the game row plus a collapsed full-width details row. Clicking the row (or the
 * title button) toggles it. Sorting / filtering / paging move whole <tbody> groups, so the
 * details always stay attached to their game.
 */

// No authorable options yet; kept so option branches can be added without restructuring.
const OPTION_CLASSES = [];
const PAGE_SIZE = 10;
const MAX_STARS = 3;
const RATING_RE = /(\d+(?:[.,]\d+)?)\s*stars?/i;

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function columnKey(label, index) {
  const s = slug(label);
  if (/desc|detail|about|summary/.test(s)) return 'description';
  if (/image|thumb|cover|picture/.test(s)) return 'image';
  if (/game|title|name/.test(s)) return 'game';
  if (/discount|sale|promo/.test(s)) return 'discount';
  if (/rating|score|quality/.test(s)) return 'rating';
  if (/price|buy|cost/.test(s)) return 'price';
  if (/platform|system|(^|-)os(-|$)/.test(s)) return 'platforms';
  return s || `col-${index + 1}`;
}

function parsePrice(text) {
  const m = text.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
}

function parseRating(text) {
  const m = text.match(RATING_RE);
  return m ? parseFloat(m[1].replace(',', '.')) : 0;
}

function parseReleaseDate(text) {
  const m = text.match(/release date:\s*(.+)$/im);
  const time = m ? Date.parse(m[1].trim()) : NaN;
  return Number.isNaN(time) ? 0 : time;
}

function decorateRating(cell) {
  const text = cell.textContent.trim();
  if (!RATING_RE.test(text)) return;
  const value = Math.min(MAX_STARS, Math.round(parseRating(text)));
  const rating = document.createElement('span');
  rating.className = 'table-games-rating';
  rating.dataset.rating = value;
  rating.setAttribute('role', 'img');
  rating.setAttribute('aria-label', text);
  for (let i = 0; i < MAX_STARS; i += 1) {
    const star = document.createElement('span');
    star.className = i < value ? 'table-games-star is-filled' : 'table-games-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = i < value ? '★' : '☆';
    rating.append(star);
  }
  cell.replaceChildren(rating);
}

function decoratePlatforms(cell) {
  const text = cell.textContent.trim();
  if (!text || cell.querySelector('img, picture')) return;
  const list = document.createElement('ul');
  list.className = 'table-games-platforms';
  text.split(/[,|/]/).map((t) => t.trim()).filter(Boolean).forEach((name) => {
    const item = document.createElement('li');
    item.className = `table-games-platform platform-${slug(name)}`;
    item.textContent = name;
    list.append(item);
  });
  cell.replaceChildren(list);
}

function decorateGame(cell) {
  const blocks = [...cell.children];
  if (!blocks.length) return;
  const [title, ...rest] = blocks;
  title.classList.add('table-games-title');
  rest.forEach((el) => {
    if (/release date/i.test(el.textContent)) el.classList.add('table-games-release');
    else el.classList.add('table-games-meta');
  });
}

let instanceId = 0;

/** Turns the game title into the disclosure button that controls the details row. */
function bindDetails(item, gameRow, detailsRow) {
  const titleEl = gameRow.querySelector('.table-games-title')
    || gameRow.querySelector('.table-games-col-game');
  if (!titleEl) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'table-games-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', detailsRow.id);
  button.append(...titleEl.childNodes);
  titleEl.replaceChildren(button);

  const setExpanded = (expanded) => {
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    detailsRow.hidden = !expanded;
    item.classList.toggle('is-expanded', expanded);
  };
  button.addEventListener('click', () => setExpanded(button.getAttribute('aria-expanded') !== 'true'));

  // the whole row is clickable, like the source site; interactive children keep their behaviour
  gameRow.classList.add('table-games-has-details');
  gameRow.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, select, textarea')) return;
    if (window.getSelection && String(window.getSelection())) return; // allow copying text
    button.click();
  });
}

function buildToolbar(block, table, refresh) {
  const toolbar = document.createElement('div');
  toolbar.className = 'table-games-toolbar';

  const searchLabel = document.createElement('label');
  searchLabel.className = 'table-games-search';
  const searchText = document.createElement('span');
  searchText.className = 'table-games-visually-hidden';
  searchText.textContent = 'Search for games';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search for Games';
  searchLabel.append(searchText, search);

  const sortLabel = document.createElement('label');
  sortLabel.className = 'table-games-sort';
  const sortText = document.createElement('span');
  sortText.className = 'table-games-visually-hidden';
  sortText.textContent = 'Sort games';
  const sort = document.createElement('select');
  [
    ['', 'Sort by'],
    ['game-asc', 'Name (A-Z)'],
    ['game-desc', 'Name (Z-A)'],
    ['release-desc', 'Newest'],
    ['release-asc', 'Oldest'],
    ['price-asc', 'Price (low to high)'],
    ['price-desc', 'Price (high to low)'],
    ['rating-desc', 'Rating'],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sort.append(option);
  });
  sortLabel.append(sortText, sort);

  toolbar.append(searchLabel, sortLabel);

  search.addEventListener('input', () => {
    block.dataset.query = search.value.trim().toLowerCase();
    refresh(true);
  });
  sort.addEventListener('change', () => {
    const items = Array.from(table.tBodies);
    const [key, dir] = (sort.value || 'original-asc').split('-');
    const factor = dir === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      const av = a.dataset[key] ?? '';
      const bv = b.dataset[key] ?? '';
      if (key === 'game') return factor * av.localeCompare(bv);
      return factor * (parseFloat(av) - parseFloat(bv));
    });
    table.append(...items);
    refresh(true);
  });
  return toolbar;
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  active.forEach((option) => block.classList.add(`table-games-${option}`));

  const rows = [...block.children];
  if (!rows.length) return;

  instanceId += 1;
  const headerRow = rows[0];
  const labels = [...headerRow.children].map((c) => c.textContent.trim());
  const keys = labels.map((l, i) => columnKey(l, i));
  const columnCount = keys.filter((k) => k !== 'description').length;

  const table = document.createElement('table');
  const thead = document.createElement('thead');

  const headTr = document.createElement('tr');
  labels.forEach((label, i) => {
    if (keys[i] === 'description') return;
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = `table-games-col-${keys[i]}`;
    th.textContent = label;
    headTr.append(th);
  });
  thead.append(headTr);
  table.append(thead);

  rows.slice(1).forEach((row, rowIndex) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const item = document.createElement('tbody');
    item.className = 'table-games-item';
    item.dataset.original = rowIndex;
    const tr = document.createElement('tr');
    tr.className = 'table-games-row';
    let description = null;
    [...row.children].forEach((cell, i) => {
      const key = keys[i] || `col-${i + 1}`;
      if (key === 'description') {
        if (cell.textContent.trim() || cell.querySelector('picture, img')) description = cell;
        return;
      }
      const td = document.createElement('td');
      td.className = `table-games-col-${key}`;
      if (labels[i]) td.dataset.label = labels[i];
      td.append(...cell.childNodes);

      if (key === 'image') {
        const img = td.querySelector('img');
        // external images can't go through the media optimizer (it drops the origin)
        if (img && new URL(img.src).origin === window.location.origin) {
          td.replaceChildren(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]));
        }
      } else if (key === 'game') {
        decorateGame(td);
        const titleEl = td.querySelector('.table-games-title');
        item.dataset.game = (titleEl || td).textContent.trim().toLowerCase();
        item.dataset.release = parseReleaseDate(td.innerText || td.textContent);
      } else if (key === 'rating') {
        item.dataset.rating = parseRating(td.textContent);
        decorateRating(td);
      } else if (key === 'platforms') {
        decoratePlatforms(td);
      } else if (key === 'price') {
        item.dataset.price = parsePrice(td.textContent);
      }
      tr.append(td);
    });
    // search the visible row only (title, platforms, ...), not the long description
    item.dataset.search = tr.textContent.toLowerCase();
    item.append(tr);

    if (description) {
      const detailsRow = document.createElement('tr');
      detailsRow.className = 'table-games-details';
      detailsRow.id = `table-games-${instanceId}-details-${rowIndex}`;
      detailsRow.hidden = true;
      const td = document.createElement('td');
      td.colSpan = columnCount;
      const content = document.createElement('div');
      content.className = 'table-games-description';
      content.append(...description.childNodes);
      td.append(content);
      detailsRow.append(td);
      item.append(detailsRow);
      bindDetails(item, tr, detailsRow);
    }
    table.append(item);
  });

  const scroller = document.createElement('div');
  scroller.className = 'table-games-scroller';
  scroller.append(table);

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'table-games-load-more';
  more.textContent = 'Load more';

  const empty = document.createElement('p');
  empty.className = 'table-games-empty';
  empty.textContent = 'No games found.';
  empty.hidden = true;

  let visible = PAGE_SIZE;
  const refresh = (reset) => {
    if (reset) visible = PAGE_SIZE;
    const query = block.dataset.query || '';
    const matches = Array.from(table.tBodies).filter((item) => {
      const match = !query || item.dataset.search.includes(query);
      item.hidden = true;
      return match;
    });
    matches.slice(0, visible).forEach((item) => { item.hidden = false; });
    more.hidden = matches.length <= visible;
    empty.hidden = matches.length > 0;
  };

  more.addEventListener('click', () => {
    visible += PAGE_SIZE;
    refresh(false);
  });

  block.replaceChildren(buildToolbar(block, table, refresh), scroller, empty, more);
  refresh(true);
}
