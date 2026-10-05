# PlayInjector Homepage Migration Plan

## Overview
Move the **https://www.playinjector.com/** homepage (just this one page) to AEM Edge Delivery Services. The work covers the page content, the blocks it needs, the visual design, the header and footer, and a final check against the original site.

## Current Project State
- **Project type:** document-based. Content is authored in Google Drive (taken from the site's content mount).
- **Blocks already in the project:** Hero, Cards, Columns, Header, Footer, Fragment. These are the boilerplate blocks. We'll reuse them where they fit and create variants only where the homepage needs something different.
- **Existing migrated content:** none yet. This is the first page.

## Scope
| In scope | Out of scope |
|---|---|
| Homepage content (all sections) | Other pages and templates |
| Blocks and block variants the homepage needs | A full site crawl or catalog |
| Global design (colors, typography, spacing) and block styling | Commerce or product-detail pages |
| Header and navigation, footer | Publishing live (can be done after review) |
| Visual check against the original | |

## Approach
1. **Analyze the page:** scrape the homepage, capture screenshots and cleaned HTML, and split it into sections and content sequences.
2. **Map blocks:** decide which parts stay as default content and which become blocks. Reuse existing blocks and name new variants only where needed.
3. **Build the blocks:** create any missing blocks or variants and check that they render.
4. **Build the import tools:** write a parser for each block variant and transformers for page cleanup and sections, then bundle them into an import script.
5. **Import the content:** run the import script on the homepage to produce the page content, then check it in the preview.
6. **Migrate the design:** pull design tokens (colors, fonts, spacing) from the original site into global styles, then style each block to match.
7. **Header and footer:** rebuild the navigation (desktop, mobile, any mega menu) and the footer from the source site.
8. **Validate:** compare the migrated page with the original section by section and fix differences in layout, styling and content.

## Checklist
- [ ] Confirm the project type (document-based) and the block library to use
- [ ] Scrape the homepage, capturing screenshots, cleaned HTML, metadata and images
- [ ] Analyze the page structure: section boundaries, content sequences, block candidates
- [ ] Decide default content vs. blocks for each section
- [ ] Map sections to existing blocks (Hero, Cards, Columns, etc.) and name any new variants
- [ ] Record block selectors and mappings for the homepage template
- [ ] Generate any new blocks or variants and check that they render
- [ ] Generate a parser for each block variant
- [ ] Generate page transformers (cleanup, section breaks, metadata)
- [ ] Bundle the import script
- [ ] Run the import for the homepage
- [ ] Check the imported page in the preview: all sections there, blocks rendering, images loading
- [ ] Extract global design tokens (colors, typography, spacing, buttons) into site styles
- [ ] Style each block on the homepage to match the original
- [ ] Migrate the header and navigation (desktop and mobile)
- [ ] Migrate the footer
- [ ] Run a full-page visual comparison against the original and fix the gaps found
- [ ] Final review with you, then optionally commit or publish

## Risks & Notes
- **Bot protection or heavy JavaScript on the source:** if the scrape is blocked, a fallback scraping method will be used.
- **Dynamic or animated sections** (sliders, video, embeds) may need a custom block or a simpler authored version. I'll flag these during analysis.
- **Images** start out pointing at the source URLs. Moving them into the project's own media can happen later.
- Nothing is published or pushed until you approve it.

## Next Step
Switch to **Execute mode** to start. The workflow will begin with page analysis and check in with you after block mapping, before any blocks or content are generated.
