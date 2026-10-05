/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/cards-game-stack.js
  var PLATFORM_NAMES = {
    windows: "Windows",
    apple: "Mac",
    mac: "Mac",
    linux: "Linux",
    steam: "Steam",
    drm: "DRM-free",
    english: "English",
    french: "French",
    german: "German"
  };
  function platformName(icon) {
    const title = (icon.getAttribute("title") || "").trim();
    if (title) return title;
    const cls = [...icon.classList].find((c) => c.startsWith("sprite-"));
    if (!cls) return "";
    const key = cls.replace("sprite-", "");
    return PLATFORM_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }
  function p(document2, text) {
    const el = document2.createElement("p");
    el.textContent = text;
    return el;
  }
  function parse(element, { document: document2 }) {
    const boxes = [...element.querySelectorAll(":scope > .game-box, :scope > div > .game-box")];
    const cells = [];
    boxes.forEach((box) => {
      const titleEl = box.querySelector(".game-box-title, .game-box-title-full");
      const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
      const img = box.querySelector('.game-box-image img[alt="cover"]') || box.querySelector(".game-box-image img:last-of-type") || box.querySelector(".game-box-image-full img");
      const body = [];
      if (titleText) {
        const h = document2.createElement("h3");
        h.textContent = titleText;
        body.push(h);
      }
      const quality = box.querySelector(".game-box-quality [title], .game-box-quality .quality");
      const rating = quality ? (quality.getAttribute("title") || quality.textContent).trim() : "";
      if (rating) body.push(p(document2, rating));
      const priceEl = box.querySelector(".game-box-price-no-discount, .game-box-price");
      const price = priceEl ? priceEl.textContent.replace(/\s+/g, " ").trim() : "";
      if (price) body.push(p(document2, price));
      const platforms = [...box.querySelectorAll(".game-box-right .sprite")].map(platformName).filter(Boolean);
      if (platforms.length) body.push(p(document2, platforms.join(", ")));
      const link = box.querySelector("a.green-button, a.green-button-gs, .game-box-bottom a[href]");
      const button = box.querySelector("button.game-box-buy, .game-box-buy");
      if (link) {
        const a = document2.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = link.textContent.trim();
        const wrap = document2.createElement("p");
        wrap.append(a);
        body.push(wrap);
      } else if (button && button.textContent.trim()) {
        const a = document2.createElement("a");
        a.href = "https://www.playinjector.com/";
        a.textContent = button.textContent.trim();
        const wrap = document2.createElement("p");
        wrap.append(a);
        body.push(wrap);
      }
      if (!img && !body.length) return;
      cells.push([img || "", body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-game-stack", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-game-banner.js
  function parse2(element, { document: document2 }) {
    let slides = [...element.querySelectorAll(".carousel-inner > .item")];
    if (!slides.length) slides = [...element.querySelectorAll(".item, .carousel-item")];
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (!img) return;
      const link = img.closest("a") || slide.querySelector("a[href]");
      let media = img;
      if (link && link.getAttribute("href") && !link.getAttribute("href").startsWith("#")) {
        const a = document2.createElement("a");
        a.href = link.getAttribute("href");
        a.append(img);
        media = a;
      }
      const caption = slide.querySelector(".carousel-caption, .caption");
      const content = [];
      if (caption && caption.textContent.trim()) {
        content.push(...caption.querySelectorAll(":scope > *"));
        if (!content.length) content.push(caption.textContent.trim());
      }
      cells.push([media, content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-game-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-info-reveal.js
  function isEmpty(el) {
    return !el.querySelector("img, picture, a, video, iframe") && el.textContent.replace(/\u00a0/g, " ").trim() === "";
  }
  function parse3(element, { document: document2 }) {
    let columns = [...element.querySelectorAll(":scope > .splitleft, :scope > .splitright")];
    if (!columns.length) columns = [...element.querySelectorAll(":scope > div")];
    const row = [];
    columns.forEach((col) => {
      const container = col.querySelector(":scope > .centering") || col;
      const content = [...container.children].filter((el) => {
        if (!el.matches("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")) return false;
        return !isEmpty(el);
      });
      row.push(content.length ? content : "");
    });
    if (!row.some((c) => c !== "")) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-info-reveal", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-games.js
  var PLATFORM_NAMES2 = {
    windows: "Windows",
    apple: "Mac",
    mac: "Mac",
    linux: "Linux",
    steam: "Steam",
    drm: "DRM-free",
    english: "English",
    french: "French",
    german: "German"
  };
  function platformName2(icon) {
    const title = (icon.getAttribute("title") || "").trim();
    if (title) return title;
    const cls = [...icon.classList].find((c) => c.startsWith("sprite-"));
    if (!cls) return "";
    const key = cls.replace("sprite-", "");
    return PLATFORM_NAMES2[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function p2(document2, text) {
    const el = document2.createElement("p");
    el.textContent = text;
    return el;
  }
  function parse4(element, { document: document2 }) {
    const table = element.matches("table") ? element : element.querySelector("table#games-container, table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.querySelectorAll("tr")].filter((tr) => !/(^|\s)game-details-/.test(tr.className) && !tr.classList.contains("hide") && tr.querySelector(".game-list-title, .game-name"));
    const cells = [["Image", "Game", "Discount", "Rating", "Platforms", "Price", "Description"]];
    rows.forEach((tr) => {
      var _a, _b, _c;
      const tds = [...tr.querySelectorAll(":scope > td")];
      const img = tr.querySelector(".game-list-image img") || tds[0] && tds[0].querySelector("img");
      const titleTd = tr.querySelector(".game-list-title") || tds[1];
      const game = [];
      const name = clean((_a = titleTd == null ? void 0 : titleTd.querySelector(".game-name")) == null ? void 0 : _a.textContent);
      const desc = clean((_b = titleTd == null ? void 0 : titleTd.querySelector(".game-description")) == null ? void 0 : _b.textContent);
      if (name) game.push(p2(document2, name));
      if (desc) game.push(p2(document2, desc));
      if (!game.length && titleTd) game.push(clean(titleTd.textContent));
      const discount = clean((_c = tds[2]) == null ? void 0 : _c.textContent) || "-";
      const quality = tr.querySelector(".game-quality .quality, .game-quality [title]");
      const rating = quality ? clean(quality.getAttribute("title") || quality.textContent) : "";
      const platforms = [...tr.querySelectorAll(".game-icons .sprite")].map(platformName2).filter(Boolean).join(", ");
      const priceTd = tr.querySelector(".game-list-price") || tds[5];
      const price = clean(priceTd == null ? void 0 : priceTd.textContent);
      const details = tr.nextElementSibling;
      const description = [];
      if (details && /(^|\s)game-details-/.test(details.className)) {
        details.querySelectorAll(".game-list-description p").forEach((para) => {
          const segments = [""];
          para.childNodes.forEach((node) => {
            if (node.nodeName === "BR") segments.push("");
            else segments[segments.length - 1] += node.textContent;
          });
          segments.forEach((segment) => {
            const text = clean(segment.replace(/\u00a0/g, " "));
            if (text) description.push(p2(document2, text));
          });
        });
      }
      cells.push([img || "", game, discount, rating, platforms, price, description]);
    });
    if (cells.length === 1) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-games", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/playinjector-cleanup.js
  var TransformHook = {
    preprocess: "preprocess",
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.preprocess) {
      element.querySelectorAll("i.quality, i.sprite").forEach((icon) => {
        const span = element.ownerDocument.createElement("span");
        [...icon.attributes].forEach((attr) => span.setAttribute(attr.name, attr.value));
        icon.replaceWith(span);
      });
    }
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#choosePlatformModal",
        "#cartModal",
        "#cart-content"
      ]);
      WebImporter.DOMUtils.remove(element, ["#load-more-games"]);
      const nav = element.querySelector("#homeGamesListNavigation");
      if (nav) {
        nav.querySelectorAll(":scope > li").forEach((li) => {
          const link = li.querySelector("a");
          if (link && link.classList.contains("hide")) li.remove();
        });
        nav.querySelectorAll(":scope > span.btn-separator").forEach((s) => s.remove());
      }
      const box = element.querySelector("#content > div.centerwrap .left-column .displayer-box");
      if (box) {
        const doc = element.ownerDocument;
        box.querySelectorAll(".displayer-signup").forEach((el) => el.style.removeProperty("background-image"));
        box.querySelectorAll("span.big-text").forEach((span) => {
          const strong = doc.createElement("strong");
          strong.innerHTML = span.innerHTML;
          span.replaceWith(strong);
        });
        const title = box.querySelector(":scope > .title");
        if (title) {
          const h2 = doc.createElement("h2");
          h2.innerHTML = title.innerHTML;
          title.replaceWith(h2);
        }
        const items = [...box.querySelectorAll(":scope > p.list-check")];
        if (items.length) {
          const ul = doc.createElement("ul");
          items[0].before(ul);
          items.forEach((p3) => {
            const li = doc.createElement("li");
            li.innerHTML = p3.innerHTML;
            ul.append(li);
            p3.remove();
          });
        }
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site header: <div id="topwrap">
        "#topwrap",
        // Empty sidebar: <div class="span-5 last"> directly under #wrapper
        "#wrapper > div.span-5.last",
        // Footer: <div class="footer"> directly under #wrapper
        "#wrapper > div.footer",
        // Genre filter / search / sort UI: <form class="search-box" id="search-games">
        "#search-games",
        // Close arrow for the info reveal: <div id="infoclose">
        "#infoclose",
        // Non-authorable tags
        "script",
        "noscript",
        "iframe",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/playinjector-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "cards-game-stack": parse,
    "carousel-game-banner": parse2,
    "columns-info-reveal": parse3,
    "table-games": parse4
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "PlayInjector shop homepage: promo strip, featured games showcase (category links, game card stack, banner carousel), MyNI-SHOP info reveal, and games catalog with sidebar promo",
    urls: [
      "https://www.playinjector.com/"
    ],
    blocks: [
      {
        name: "cards-game-stack",
        instances: ["#homeGamesList"]
      },
      {
        name: "carousel-game-banner",
        instances: ["#homeCarousel"]
      },
      {
        name: "columns-info-reveal",
        instances: ["#videobox"]
      },
      {
        name: "table-games",
        instances: ["#content > div.centerwrap .games-presentation"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "promo-strip",
        selector: ["#content > div.top-text"],
        style: "accent-strip",
        blocks: [],
        defaultContent: ["#content > div.top-text"]
      },
      {
        id: "rc2",
        name: "featured-games-showcase",
        selector: ["#content > div.top-container"],
        style: "dark, showcase",
        blocks: ["cards-game-stack", "carousel-game-banner"],
        defaultContent: ["#homeGamesListNavigation"]
      },
      {
        id: "rc3",
        name: "myni-shop-info",
        selector: ["#content > div.infotext", "#infotext"],
        style: "accent-strip",
        blocks: ["columns-info-reveal"],
        defaultContent: ["#infotext"]
      },
      {
        id: "rc4",
        name: "games-catalog",
        selector: ["#content > div.centerwrap"],
        style: "dark, sidebar-left",
        blocks: ["table-games"],
        defaultContent: ["#content > div.centerwrap .left-column .displayer-box"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    /**
     * Runs before the importer's own DOM cleanup (which strips empty inline elements).
     */
    preprocess: (payload) => {
      executeTransformers("preprocess", payload.document.body, payload);
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
