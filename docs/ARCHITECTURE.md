# Arquitectura y traspaso

Estado del proyecto, hacia dónde va y las trampas ya resueltas. Sirve como
punto de partida para refactorizar sin volver a descubrir nada.

## 1. Qué hay hoy

```
src/
  lib/            lógica sin React
    types.ts        Annotation, BookRecord, Settings, Locale…
    storage.ts      IndexedDB (libros, handles) + localStorage (ajustes, estantería) + migraciones
    idb.ts          wrapper mínimo de IndexedDB
    handles.ts      File System Access: reabrir con un clic
    book.ts         id del libro (SHA-256), formatos, título desde el nombre
    reading.ts      CSS que se inyecta en el libro (tema, fuentes, tipografía)
    mark.ts         dibujo de resaltados (Overlayer) y estilo de búsqueda
    quoteCard.ts    tarjeta de cita 1200×800 en canvas
    exportMarkdown.ts
    toc.ts          normalización del índice
    foliate.ts      tipos del motor + helpers (título, autor, TOC)
    format.ts       percent, bytes, relativeTime, downloadText
    links.ts        DONATE_URL, REPO_URL
    version.ts      APP_VERSION (0.0.1)
  i18n/           es / en / zh + provider
  reader/
    ReaderScreen.tsx    orquestador: estado, layout, atajos
    useFoliate.ts       ciclo de vida del motor, anotaciones, búsqueda, anchors
    Sidebar.tsx         panel (índice, buscar, notas, marcas, ajustes)
    MarginNotes.tsx     notas al margen + burbujas
    SelectionPopover.tsx
    NoteDialog.tsx / QuoteDialog.tsx
    touch/selection.ts  selección propia en táctil
  shelf/          portada
  components/     Icons, ErrorBoundary, InstallButton
  styles/         SCSS: tokens, base, shelf, reader, panels, gutter, popover, crash, decor
  vendor/foliate/ motor con 3 parches (ver README)
```

## 2. Hacia dónde va

```
src/
  core/           sin React ni UI
    book/         apertura, CFI, metadatos, TOC
    storage/      IndexedDB + localStorage + migraciones
    i18n/
  viewer/         el motor, un solo componente
    BookViewer.tsx
    plugins/
      types.ts    contrato
      registry.ts
  features/       cada cosa que se “engancha” al visor
    annotations/  resaltados y estilos
    notes/        margen y burbujas
    quotes/       tarjeta de cita
    bookmarks/
    search/
    touch/        selección táctil
  ui/             Button, Dialog, Segmented, Slider, Toggle
  screens/        Shelf, Reader
```

### Contrato del plugin

```ts
export interface ViewerApi {
  readonly book: BookInfo
  getContents(): { doc: Document; index: number }[]
  getCFI(index: number, range: Range): string
  addMark(annotation: Annotation): Promise<void>
  removeMark(annotation: Annotation): Promise<void>
  goTo(target: string | number): Promise<void>
}

export interface ViewerPlugin {
  id: string
  setup(view: ViewerApi): void
  onLoad?(section: { index: number; doc: Document }): void
  onSelection?(selection: SelectionInfo | null): void
  onRelocate?(location: LocationInfo): void
  onDraw?(annotation: Annotation, draw: DrawFn): void
  destroy(): void
}
```

Registro: `createRegistry([annotationsPlugin, notesPlugin, …])` y `BookViewer`
recibe `plugins` por props. `useFoliate` queda como el adaptador que traduce
eventos del motor a llamadas del contrato.

### Orden de migración (la app funciona entre pasos)

1. `core/`: mover `lib/{storage,idb,handles,book,toc,format}` sin cambiar firmas.
2. `ui/`: extraer Button/IconButton/Dialog/Segmented/Slider/Toggle desde
   `Sidebar`, `NoteDialog` y `QuoteDialog`. Sin lógica nueva.
3. `viewer/plugins/types.ts` + `registry.ts` (solo tipos, nada conectado).
4. Migrar **bookmarks** como primer plugin (es el más pequeño y prueba el
   contrato de punta a punta).
5. Migrar **annotations** y **notes**; `ReaderScreen` adelgaza.
6. Migrar **search**, **quotes** y **touch**.
7. Borrar lo que quede duplicado; `npm test` verde en cada paso.

## 3. Trampas ya resueltas (no volver a pisarlas)

- **Motor**: `src/vendor/foliate/` con 3 parches marcados `patch (open-reader)`
  (overlayer en fixed-layout, escala CSS del PDF, assets en `/pdfjs/`).
- **CFI en PDF**: el texto vive en la capa `.textLayer`; seleccionar un nodo
  entero da CFIs vacíos. `readSelection` baja hasta el nodo de texto.
- **Tres clics**: `range.selectNodeContents` no produce CFI útil; se normaliza
  descendiendo al primer/último nodo de texto.
- **Táctil**: el menú de Android/iOS es UI del navegador, no se puede cerrar.
  Solución: `user-select: none` + pulsación larga con `caretRangeFromPoint` y
  pintado propio (`reader/touch/selection.ts`). En escritorio no se activa.
- **PWA**: el service worker sirve caché; tras desplegar hace falta recarga
  dura o `autoUpdate` en la siguiente visita.
- **Alto en tablet**: usar `100%` / `100svh`, nunca `100dvh` (la barra de Chrome
  tapa los controles).
- **Despliegue**: el NUC no aguanta `docker build`; es `npm run build` + `scp` +
  `chmod -R a+rX` (scp crea 700 y nginx da 403).
- **CSP**: `script-src 'self'` es lo que impide que un EPUB ejecute scripts.
  `frame-ancestors 'none'`, `Permissions-Policy` y `COOP` ya están puestos.
- **HMR**: tras renombrar módulos, Vite puede dejar dos instancias del contexto
  (el idioma no cambia). Reiniciar el dev server; no afecta al build.
- **IndexedDB en tests**: `fake-indexeddb` + `resetIdb()`; los handles reales no
  son clonables, se prueba solo la lógica de permisos.

## 4. Convenciones

- Versión en `src/lib/version.ts` y `package.json`; se muestra en el pie.
- Todo texto de UI pasa por `t('clave')` y existe en los tres diccionarios
  (el tipo `MessageKey` obliga).
- Estilos en SCSS con tokens (`_tokens.scss`), nada inline; dos personalidades
  (`paper` / `industrial`) resueltas por variables y `_decor.scss`.
- Commits atómicos en imperativo; cada paso del refactor deja la app funcionando.

## 5. Verificación mínima por cambio

```bash
npx tsc --noEmit && npm test && npm run build
```

Y antes de publicar: abrir la portada, abrir un EPUB, seleccionar texto,
resaltar, buscar, plegar el margen y probar en 390 px y 820 px.
