# Arquitectura

Cómo está montado Open Reader, por qué las capas están separadas así y las
trampas que ya costaron tiempo. Si vas a tocar el visor, lee esto primero.

## 1. Capas

```
src/
  core/                 lógica pura: sin React, sin DOM de la app
    types.ts              Annotation, BookRecord, Settings, Locale…
    storage.ts            IndexedDB (libros, handles) + localStorage (ajustes,
                          estantería) + migraciones
    idb.ts                wrapper mínimo de IndexedDB
    handles.ts            File System Access: reabrir con un clic
    book.ts               id del libro (SHA-256), formatos, título del archivo
    annotation.ts         fábricas: highlightFrom(), bookmarkFrom()
    reading.ts            CSS que se inyecta dentro del libro
    mark.ts               dibujo de resaltados y estilo de búsqueda
    quoteCard.ts          tarjeta de cita 1200×800 en canvas
    exportMarkdown.ts     notas → Markdown
    toc.ts                normalización del índice
    foliate.ts            tipos del motor + helpers
    format.ts             percent, bytes, relativeTime, slug, downloadText
    links.ts / version.ts URL de donación y APP_VERSION

  i18n/                 es / en / zh + provider (MessageKey obliga a traducir)
  viewer/
    useFoliate.ts         ciclo de vida del motor: abrir, layout, anotaciones,
                          búsqueda, selección (ratón y táctil), anclas del margen
    ReaderContext.tsx     ReaderStore + useReader(): el estado de la sesión
    plugins/types.ts      contrato ViewerPlugin y PanelTab
    plugins/registry.ts   createRegistry(): huecos, orden y atajos
    plugins/index.ts      la lista de plugins = el lector

  features/             una carpeta por función, cada una un plugin
    toc/                  plugin.tsx        pestaña índice
    search/               plugin.tsx        pestaña buscar
    notes/                plugin.tsx        pestaña + margen + diálogo de nota
                          MarginNotes.tsx   tarjetas y burbujas
                          NoteDialog.tsx
    highlights/           plugin.tsx        barra de colores sobre la selección
                          SelectionPopover.tsx
    quotes/               plugin.tsx        tarjeta de cita
                          QuoteDialog.tsx
    bookmarks/            plugin.tsx        botón, atajo b y pestaña marcas
    settings/             plugin.tsx        pestaña ajustes y datos
    touch/                selection.ts      selección propia en táctil

  screens/
    ShelfScreen.tsx       portada: arrastrar, estantería, exportar
    reader/ReaderScreen.tsx  orquesta: estado, persistencia, atajos, layout
    reader/TopBar.tsx     barra superior (acciones de plugins + chrome)
    reader/BookPanel.tsx  panel lateral (pestañas del registro)
    reader/StatusBar.tsx  progreso y navegación

  ui/                   Segmented, Slider, Toggle, Dialog
  components/           Icons, ErrorBoundary, InstallButton
  styles/               SCSS con tokens; dos personalidades
  vendor/foliate/       motor con 3 parches (ver README)
```

**Regla de dependencias:** `features` y `screens` pueden importar de `viewer`,
`ui`, `core` e `i18n`. `viewer` importa de `core`. `core` no importa de nadie.
Ninguna feature importa de otra.

## 2. Cómo funciona un plugin

```ts
export interface ViewerPlugin {
  id: string
  Action?: ComponentType   // botón en la barra superior
  tab?: PanelTab           // pestaña del panel: { id, label, count?, Panel }
  Aside?: ComponentType    // UI junto a la página (el margen)
  Overlay?: ComponentType  // UI flotante (popover, diálogos)
  onKey?: (store: ReaderStore, event: KeyboardEvent) => boolean
}
```

`createRegistry(plugins)` recoge los huecos en el orden de la lista; la pantalla
solo los pinta. Añadir una función = un archivo en `features/` + una línea en
`viewer/plugins/index.ts`.

**El estado compartido va en `ReaderStore`** (`useReader()`), no en props:

- documento: `book`, `meta`, `location`, `progress`, `selection`, `annotations`,
  `settings`;
- mutaciones: `addAnnotation`, `updateAnnotation`, `deleteAnnotation`,
  `highlight()` (convierte la selección en resaltado y la limpia), `dismiss()`;
- motor: `goTo`, `goToFraction`, `next`, `prev`, `search`, `markAnchors`;
- interfaz: `panel`/`openPanel`/`closePanel`, `note`/`quote` (borradores de los
  dos editores), `fullscreen`, `flash`, `t`.

Decisiones conscientes:

- **Los editores (nota y cita) viven en el store.** Son los dos diálogos del
  lector y los abre más de una feature (el popover, la lista de notas). Tenerlos
  como estado compartido evita un bus de eventos para dos casos.
- **No hay hooks `onSelection`/`onRelocate`.** Un plugin que reaccione a la
  selección lo hace leyendo `store.selection` en su `Overlay`; menos superficie
  de contrato que mantener.
- **El estado de búsqueda vive en el store** porque el progreso sobrevive al
  cambio de pestaña: el panel se desmonta al cambiar de tab.

## 3. Trampas ya resueltas (no volver a pisarlas)

- **Motor**: `src/vendor/foliate/` con 3 parches marcados `patch (open-reader)`
  (overlayer en fixed-layout, escala CSS del PDF, assets en `/pdfjs/`).
- **CFI en PDF**: el texto vive en la capa `.textLayer`; seleccionar un nodo
  entero da CFIs vacíos. `readSelection` baja hasta el nodo de texto.
- **Tres clics**: `range.selectNodeContents` no produce CFI útil; se normaliza
  descendiendo al primer/último nodo de texto.
- **Táctil**: el menú de Android/iOS es UI del navegador, no se puede cerrar.
  Solución: `user-select: none` + pulsación larga con `caretRangeFromPoint` y
  pintado propio (`features/touch/selection.ts`). En escritorio no se activa.
- **PWA**: el service worker sirve caché; tras desplegar hace falta recarga
  dura o `autoUpdate` en la siguiente visita.
- **Alto en tablet**: usar `100%` / `100svh`, nunca `100dvh` (la barra de Chrome
  tapa los controles).
- **Despliegue**: el NUC no aguanta `docker build`; es `npm run build` + `scp` +
  `chmod -R a+rX` (scp crea 700 y nginx da 403). Si reemplazas el directorio
  `dist/` entero, reinicia el contenedor: el bind mount apunta al inodo viejo y
  nginx devuelve 403 (ver `deploy/eridu.md`).
- **CSP**: `script-src 'self'` es lo que impide que un EPUB ejecute scripts.
  `frame-ancestors 'none'`, `Permissions-Policy` y `COOP` ya están puestos.
- **HMR**: tras renombrar módulos, Vite puede dejar dos instancias del contexto
  (el idioma no cambia). Reiniciar el dev server; no afecta al build.
- **IndexedDB en tests**: `fake-indexeddb` + `resetIdb()`; los handles reales no
  son clonables, se prueba solo la lógica de permisos.
- **El libro vive en un shadow root cerrado**: `document.querySelector` no lo
  atraviesa. Para probar desde la consola, usa
  `document.querySelector('foliate-view').renderer.getContents()`.

## 4. Convenciones

- Versión en `src/core/version.ts` y `package.json`; se muestra en el pie.
- Todo texto de UI pasa por `t('clave')` y existe en los tres diccionarios
  (el tipo `MessageKey` obliga). `store.t` es para los plugins que corren fuera
  de un componente (atajos).
- Estilos en SCSS con tokens (`_tokens.scss`), nada inline; dos personalidades
  (`paper` / `industrial`) resueltas por variables y `_decor.scss`.
- Commits atómicos en imperativo; cada paso del refactor deja la app funcionando.

## 5. Verificación

```bash
npx tsc --noEmit && npm test && npm run build
```

Y antes de publicar, a mano: abrir la portada, abrir un EPUB, seleccionar texto,
resaltar, buscar, plegar el margen, abrir Ajustes y probar en 390 px y 820 px.
