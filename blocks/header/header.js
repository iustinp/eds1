// The source site has no responsive layout (phones show the desktop page zoomed out), so the
// header keeps its desktop layout and is scaled to fit viewports narrower than this width.
const DESIGN_WIDTH = 1250;

function updateScale() {
  const scale = Math.min(1, document.documentElement.clientWidth / DESIGN_WIDTH);
  document.documentElement.style.setProperty('--nav-scale', scale);
}

/**
 * Fetches the nav fragment (metadata-independent):
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<Element|null>} wrapper holding the fragment's section divs
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // image paths in the fragment are relative to the fragment, not to the page
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

function isExternal(a) {
  return new URL(a.href, window.location).origin !== window.location.origin;
}

/**
 * Marks an element whose content is a pair of images (rest + hover state).
 * @param {Element} el element containing the images
 */
function decorateImagePair(el) {
  const imgs = el.querySelectorAll(':scope img');
  if (imgs.length < 2) return;
  imgs[0].classList.add('nav-img-rest');
  imgs[1].classList.add('nav-img-hover');
  imgs[1].alt = '';
}

/**
 * Turns a "placeholder" paragraph + icon paragraph into a newsletter form.
 * @param {Element} placeholderP paragraph holding the placeholder copy
 * @param {Element} iconP paragraph holding the submit icon images (optional)
 */
function buildSubscribeForm(placeholderP, iconP) {
  const form = document.createElement('form');
  form.className = 'nav-subscribe';
  form.noValidate = true;

  const label = document.createElement('label');
  label.className = 'nav-visually-hidden';
  label.htmlFor = 'nav-subscribe-email';
  label.textContent = placeholderP.textContent.replace(/[.…]+$/, '').trim();

  const input = document.createElement('input');
  input.type = 'email';
  input.name = 'email';
  input.id = 'nav-subscribe-email';
  input.placeholder = placeholderP.textContent.trim();
  input.autocomplete = 'email';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-subscribe-submit';
  submit.setAttribute('aria-label', label.textContent);
  if (iconP) {
    submit.append(...iconP.querySelectorAll('img'));
    decorateImagePair(submit);
  }

  const message = document.createElement('p');
  message.className = 'nav-subscribe-message';
  message.setAttribute('role', 'status');

  form.append(label, input, submit, message);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // no subscription endpoint is configured yet; expose the intent for integrations
    form.dispatchEvent(new CustomEvent('nav:subscribe', { bubbles: true, detail: { email: input.value } }));
  });

  placeholderP.replaceWith(form);
  if (iconP) iconP.remove();
  return form;
}

/**
 * Decorates the tools section: utility links, subscribe form, icon button, icon links.
 * Elements are recognised by their shape, not by their text.
 * @param {Element} tools the tools section
 */
function decorateTools(tools) {
  const lists = [...tools.querySelectorAll(':scope > ul')];
  lists.forEach((ul) => {
    const iconList = [...ul.querySelectorAll(':scope > li')].every((li) => li.querySelector('img'));
    ul.classList.add(iconList ? 'nav-social' : 'nav-utility');
    ul.querySelectorAll('a').forEach((a) => {
      if (iconList) {
        decorateImagePair(a);
        a.setAttribute('aria-label', a.querySelector('img')?.alt || a.textContent);
      }
      if (isExternal(a)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  });

  const paragraphs = [...tools.querySelectorAll(':scope > p')];
  // text-only paragraph followed by an image-pair paragraph => subscribe form
  const placeholderP = paragraphs.find((p) => !p.querySelector('img, a') && p.textContent.trim());
  if (placeholderP) {
    const next = placeholderP.nextElementSibling;
    const iconP = next && next.tagName === 'P' && next.querySelectorAll('img').length >= 2 ? next : null;
    buildSubscribeForm(placeholderP, iconP);
  }

  // single-image paragraph without a link => icon button (e.g. cart)
  tools.querySelectorAll(':scope > p').forEach((p) => {
    const img = p.querySelector('img');
    if (!img || p.querySelector('a') || p.querySelectorAll('img').length !== 1) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-icon-button';
    button.setAttribute('aria-label', img.alt);
    img.alt = '';
    button.append(img);
    button.addEventListener('click', () => {
      button.dispatchEvent(new CustomEvent('nav:icon-click', { bubbles: true, detail: { label: button.getAttribute('aria-label') } }));
    });
    p.replaceWith(button);
  });
}

/**
 * Decorates the sections (tab) list; a <strong>-wrapped link marks the active tab.
 * @param {Element} sections the sections element
 */
function decorateSections(sections) {
  const list = sections.querySelector('ul');
  if (!list) return;
  list.classList.add('nav-tabs');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const strong = li.querySelector(':scope > strong');
    if (strong) {
      li.classList.add('is-active');
      strong.replaceWith(...strong.childNodes);
      li.querySelector('a')?.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const sectionDivs = [...fragment.children];
  ['brand', 'sections', 'tools'].forEach((name, i) => {
    if (sectionDivs[i]) sectionDivs[i].classList.add(`nav-${name}`);
  });

  const navBrand = sectionDivs.find((d) => d.classList.contains('nav-brand'));
  const navSections = sectionDivs.find((d) => d.classList.contains('nav-sections'));
  const navTools = sectionDivs.find((d) => d.classList.contains('nav-tools'));
  if (navSections) decorateSections(navSections);
  if (navTools) decorateTools(navTools);

  // layout rows: top bar (tools + brand), bottom bar (section tabs)
  const top = document.createElement('div');
  top.className = 'nav-top';
  if (navTools) top.append(navTools);
  if (navBrand) top.append(navBrand);
  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  if (navSections) bottom.append(navSections);

  nav.append(top, bottom);

  updateScale();
  window.addEventListener('resize', updateScale);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
