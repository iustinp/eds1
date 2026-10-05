/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-info-reveal. Base: columns.
 * Source: https://www.playinjector.com/ (#videobox)
 *
 * Output: 1 row x 2 cells (.splitleft, .splitright)
 *   each cell: H2 + paragraphs (italic Q&A prompts kept, links kept)
 * Empty &nbsp; spacer paragraphs are dropped.
 */
function isEmpty(el) {
  return !el.querySelector('img, picture, a, video, iframe')
    && el.textContent.replace(/\u00a0/g, ' ').trim() === '';
}

export default function parse(element, { document }) {
  let columns = [...element.querySelectorAll(':scope > .splitleft, :scope > .splitright')];
  if (!columns.length) columns = [...element.querySelectorAll(':scope > div')];

  const row = [];
  columns.forEach((col) => {
    const container = col.querySelector(':scope > .centering') || col;
    const content = [...container.children].filter((el) => {
      if (!el.matches('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')) return false;
      return !isEmpty(el);
    });
    row.push(content.length ? content : '');
  });

  if (!row.some((c) => c !== '')) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-info-reveal', cells });
  element.replaceWith(block);
}
