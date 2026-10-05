// The source site has no responsive layout (phones show the desktop page zoomed out), so the
// footer keeps its desktop layout and is scaled to fit viewports narrower than this width.
const DESIGN_WIDTH = 1250;

/**
 * Sets --footer-scale on the block so the footer shrinks like the source on narrow viewports.
 * @param {Element} block the footer block
 */
function updateScale(block) {
  const scale = Math.min(1, document.documentElement.clientWidth / DESIGN_WIDTH);
  block.style.setProperty('--footer-scale', scale);
}

/**
 * Fetches the footer fragment (metadata-independent):
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<Element|null>} wrapper holding the fragment's section divs
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // image paths in the fragment are relative to the fragment, not to the page
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  footer.className = 'footer-content';
  [...fragment.children].forEach((section, i) => {
    section.classList.add('footer-section', `footer-section-${i + 1}`);
    footer.append(section);
  });
  block.append(footer);

  updateScale(block);
  window.addEventListener('resize', () => updateScale(block));
}
