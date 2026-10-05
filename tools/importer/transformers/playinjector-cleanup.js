/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: playinjector.com site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (and live DOM for the cart drop zone).
 *
 * NOTE: div.top-container (#content > div.top-container) is content section rc2
 * (game showcase: #homeGamesListNavigation, #homeGamesList, #homeCarousel) and MUST be kept.
 */
const TransformHook = {
  preprocess: 'preprocess',
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.preprocess) {
    // The importer's own pre-processing removes empty inline elements (incl. <i>) before
    // transform() runs. Rating (<i class="quality ..." title="3 stars">) and platform
    // (<i class="sprite sprite-windows">) icons are empty <i>s whose data lives only in
    // attributes, so convert them to classed <span>s, which the importer preserves.
    element.querySelectorAll('i.quality, i.sprite').forEach((icon) => {
      const span = element.ownerDocument.createElement('span');
      [...icon.attributes].forEach((attr) => span.setAttribute(attr.name, attr.value));
      icon.replaceWith(span);
    });
  }

  if (hookName === TransformHook.beforeTransform) {
    // Modals / overlays that could interfere with block parsing.
    // <div class="modal fade" id="choosePlatformModal">, <div class="customModal hidden" id="cartModal">
    // #cart-content is the "drag games here to add to cart" drop zone (text is CSS ::after), inside #cartModal.
    WebImporter.DOMUtils.remove(element, [
      '#choosePlatformModal',
      '#cartModal',
      '#cart-content',
    ]);

    // <button class="btn btn-playinjector" id="load-more-games"> inside .games-presentation
    // (table-games block source) - remove before parsing so it is not captured in the block.
    WebImporter.DOMUtils.remove(element, ['#load-more-games']);

    // #homeGamesListNavigation: drop hidden items (<a class="homeGamesLink btn btn-link hide">
    // for "Promotions" and "New in Shop") and the empty <span class="btn-separator"> spacers.
    const nav = element.querySelector('#homeGamesListNavigation');
    if (nav) {
      nav.querySelectorAll(':scope > li').forEach((li) => {
        const link = li.querySelector('a');
        if (link && link.classList.contains('hide')) li.remove();
      });
      nav.querySelectorAll(':scope > span.btn-separator').forEach((s) => s.remove());
    }

    // Sidebar promo box (section rc4 default content): <div class="title"> is a heading and the
    // <p class="list-check"> items are a checkmark list; <span class="big-text"> is emphasis.
    const box = element.querySelector('#content > div.centerwrap .left-column .displayer-box');
    if (box) {
      const doc = element.ownerDocument;
      // The CTA bar's decorative gradient (blue-reduction.jpg) would otherwise be turned into an
      // <img> by transformBackgroundImages, which stops the link being decorated as a button.
      box.querySelectorAll('.displayer-signup').forEach((el) => el.style.removeProperty('background-image'));
      box.querySelectorAll('span.big-text').forEach((span) => {
        const strong = doc.createElement('strong');
        strong.innerHTML = span.innerHTML;
        span.replaceWith(strong);
      });
      const title = box.querySelector(':scope > .title');
      if (title) {
        const h2 = doc.createElement('h2');
        h2.innerHTML = title.innerHTML;
        title.replaceWith(h2);
      }
      const items = [...box.querySelectorAll(':scope > p.list-check')];
      if (items.length) {
        const ul = doc.createElement('ul');
        items[0].before(ul);
        items.forEach((p) => {
          const li = doc.createElement('li');
          li.innerHTML = p.innerHTML;
          ul.append(li);
          p.remove();
        });
      }
    }
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Site header: <div id="topwrap">
      '#topwrap',
      // Empty sidebar: <div class="span-5 last"> directly under #wrapper
      '#wrapper > div.span-5.last',
      // Footer: <div class="footer"> directly under #wrapper
      '#wrapper > div.footer',
      // Genre filter / search / sort UI: <form class="search-box" id="search-games">
      '#search-games',
      // Close arrow for the info reveal: <div id="infoclose">
      '#infoclose',
      // Non-authorable tags
      'script',
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
