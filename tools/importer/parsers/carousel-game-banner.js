/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-game-banner. Base: carousel.
 * Source: https://www.playinjector.com/ (#homeCarousel)
 *
 * Output: one row per slide (.carousel-inner > .item)
 *   cell 1: banner image (wrapped in its link when the source slide has one)
 *   cell 2: text overlay — empty on the source (no captions)
 * Dot indicators (ol.carousel-indicators) are ignored.
 */
export default function parse(element, { document }) {
  let slides = [...element.querySelectorAll('.carousel-inner > .item')];
  if (!slides.length) slides = [...element.querySelectorAll('.item, .carousel-item')];

  const cells = [];
  slides.forEach((slide) => {
    const img = slide.querySelector('img');
    if (!img) return;
    const link = img.closest('a') || slide.querySelector('a[href]');
    let media = img;
    if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.append(img);
      media = a;
    }

    const caption = slide.querySelector('.carousel-caption, .caption');
    const content = [];
    if (caption && caption.textContent.trim()) {
      content.push(...caption.querySelectorAll(':scope > *'));
      if (!content.length) content.push(caption.textContent.trim());
    }
    cells.push([media, content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-game-banner', cells });
  element.replaceWith(block);
}
