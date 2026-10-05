# table-games

Custom **table** block. Purpose: game-catalog-list.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Content structure

| Image | Game | Discount | Rating | Platforms | Price | Description |
| --- | --- | --- | --- | --- | --- | --- |
| thumbnail | title paragraph + `Release date: 11 March 2016` | `-` | `3 stars` | `Windows, Steam, English` | `BUY: $39.99` | one or more description paragraphs |

- The first row is the header; columns are matched by label, so order is flexible and columns may be omitted.
- **Description** is not shown as a column. It becomes a collapsed, full-width details row under the game; clicking the row (or the title button, which is keyboard accessible) expands or collapses it.
- Search matches the visible row text (title, platforms, price), not the description.
