/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsGameStackParser from './parsers/cards-game-stack.js';
import carouselGameBannerParser from './parsers/carousel-game-banner.js';
import columnsInfoRevealParser from './parsers/columns-info-reveal.js';
import tableGamesParser from './parsers/table-games.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/playinjector-cleanup.js';
import sectionsTransformer from './transformers/playinjector-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-game-stack': cardsGameStackParser,
  'carousel-game-banner': carouselGameBannerParser,
  'columns-info-reveal': columnsInfoRevealParser,
  'table-games': tableGamesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'PlayInjector shop homepage: promo strip, featured games showcase (category links, game card stack, banner carousel), MyNI-SHOP info reveal, and games catalog with sidebar promo',
  urls: [
    'https://www.playinjector.com/',
  ],
  blocks: [
    {
      name: 'cards-game-stack',
      instances: ['#homeGamesList'],
    },
    {
      name: 'carousel-game-banner',
      instances: ['#homeCarousel'],
    },
    {
      name: 'columns-info-reveal',
      instances: ['#videobox'],
    },
    {
      name: 'table-games',
      instances: ['#content > div.centerwrap .games-presentation'],
    },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'promo-strip',
      selector: ['#content > div.top-text'],
      style: 'accent-strip',
      blocks: [],
      defaultContent: ['#content > div.top-text'],
    },
    {
      id: 'rc2',
      name: 'featured-games-showcase',
      selector: ['#content > div.top-container'],
      style: 'dark, showcase',
      blocks: ['cards-game-stack', 'carousel-game-banner'],
      defaultContent: ['#homeGamesListNavigation'],
    },
    {
      id: 'rc3',
      name: 'myni-shop-info',
      selector: ['#content > div.infotext', '#infotext'],
      style: 'accent-strip',
      blocks: ['columns-info-reveal'],
      defaultContent: ['#infotext'],
    },
    {
      id: 'rc4',
      name: 'games-catalog',
      selector: ['#content > div.centerwrap'],
      style: 'dark, sidebar-left',
      blocks: ['table-games'],
      defaultContent: ['#content > div.centerwrap .left-column .displayer-box'],
    },
  ],
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  /**
   * Runs before the importer's own DOM cleanup (which strips empty inline elements).
   */
  preprocess: (payload) => {
    executeTransformers('preprocess', payload.document.body, payload);
  },

  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
