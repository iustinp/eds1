/*
 * columns-info-reveal
 * Side-by-side long-form text columns that stay collapsed until the author's preceding
 * paragraph (the "Click here to see ..." line) is activated. A close arrow collapses it again.
 * When no preceding paragraph exists the panel is simply shown (graceful fallback).
 *
 * Content contract: 1 row x N cells (typically 2); each cell = heading + paragraphs (+ link).
 */

// No authorable options yet; kept so option branches can be added without restructuring.
const OPTION_CLASSES = [];

let instanceId = 0;

function isEmptyParagraph(el) {
  return el.tagName === 'P'
    && !el.querySelector('picture, img, a')
    && el.textContent.replace(/\u00a0/g, ' ').trim() === '';
}

/** The last text element directly before this block inside the same section. */
function findTrigger(block) {
  const wrapper = block.parentElement;
  let prev = wrapper ? wrapper.previousElementSibling : null;
  while (prev && !prev.textContent.trim()) prev = prev.previousElementSibling;
  if (!prev) return null;
  const candidates = prev.matches('p, h1, h2, h3, h4, h5, h6')
    ? [prev]
    : [...prev.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')];
  return candidates.pop() || null;
}

function setExpanded(block, trigger, expanded) {
  const wrapper = block.parentElement;
  block.classList.toggle('is-expanded', expanded);
  block.hidden = !expanded;
  if (wrapper) wrapper.classList.toggle('is-expanded', expanded);
  if (trigger) trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  active.forEach((option) => block.classList.add(`columns-info-reveal-${option}`));

  instanceId += 1;
  block.id = block.id || `columns-info-reveal-${instanceId}`;

  const rows = [...block.children];
  const colCount = rows[0] ? rows[0].children.length : 0;
  block.classList.add(`columns-info-reveal-${colCount}-cols`);

  rows.forEach((row) => {
    row.classList.add('columns-info-reveal-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-info-reveal-col');
      // drop empty / &nbsp; spacer paragraphs carried over from the source
      col.querySelectorAll('p').forEach((p) => { if (isEmptyParagraph(p)) p.remove(); });
    });
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'columns-info-reveal-close';
  close.setAttribute('aria-label', 'Close');
  close.setAttribute('aria-controls', block.id);
  block.append(close);

  const trigger = findTrigger(block);
  if (!trigger) {
    // nothing to toggle from: keep the content visible and drop the close control
    close.remove();
    block.classList.add('is-expanded');
    return;
  }

  trigger.classList.add('columns-info-reveal-trigger');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-controls', block.id);

  const toggle = (e) => {
    if (e) e.preventDefault();
    const expanded = !block.classList.contains('is-expanded');
    setExpanded(block, trigger, expanded);
    if (expanded) block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggle(e);
  });
  close.addEventListener('click', () => {
    setExpanded(block, trigger, false);
    trigger.focus();
  });
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setExpanded(block, trigger, false);
      trigger.focus();
    }
  });

  setExpanded(block, trigger, false);
}
