# Third-party notices

## Runtime dependencies

| Project | Version | License | Use |
| --- | --- | --- | --- |
| [foliate-js](https://github.com/johnfactotum/foliate-js) | commit `78914ae` (2026-05-01) | MIT | Book parsing and pagination engine, vendored in `src/vendor/foliate/` with three documented patches |
| [pdf.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) | 5.5.207 | Apache-2.0 | PDF rendering, text layer and annotation layer |
| [@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js) | 2.7.x | BSD-3-Clause | Random access to zipped containers (EPUB, CBZ, FBZ) |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.x | MIT | Inflate for MOBI/KF8 fonts |
| [React](https://react.dev) / [React DOM](https://react.dev) | 19.x | MIT | UI |
| [Vite](https://vite.dev) | 7.x | MIT | Build tooling |

## Assets

- `public/pdfjs/text_layer_builder.css` and
  `public/pdfjs/annotation_layer_builder.css` come from the pdf.js repository at
  tag `v5.5.207` (Apache-2.0). They are committed because `pdfjs-dist` does not
  ship those two files; the rest of the pdf.js assets are copied from
  `node_modules` by `scripts/copy-pdfjs-assets.mjs`.
- Fonts (IBM Plex Sans, IBM Plex Mono, Literata) are loaded from Google Fonts
  under the SIL Open Font License 1.1.
