# Open Reader

Lector de libros en el navegador. Abre el archivo que quieras —**EPUB, MOBI,
AZW3, FB2, CBZ o PDF**—, resalta en cinco colores, subraya, tacha, deja notas al
margen, marca páginas, busca dentro del libro y guarda citas. El archivo nunca
sale de tu equipo: no hay cuentas, no hay servidor y no hay subida.

**En vivo:** https://open-reader.eridu.top · **Escritorio:** `release/OpenReader.exe`

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jdsalasca)

## Qué hace

- **Un motor para todos los formatos.** [foliate-js](https://github.com/johnfactotum/foliate-js)
  renderiza texto reflowable y páginas fijas, con capa de texto real en los PDF
  (por eso se puede seleccionar y resaltar).
- **Notas y marcadores.** Resaltado, subrayado, ondulado y tachado, en ámbar,
  óxido, salvia, cielo e iris. Cada marca admite una nota escrita.
- **Notas al margen.** Las notas del capítulo aparecen como tarjetas al lado de
  la página, con su color, su cita y un «me gusta». Se apagan en Ajustes.
- **Buscar en el libro.** `Ctrl+F`, resultados agrupados por capítulo con la
  frase y el salto exacto al pasaje.
- **Citas.** Selecciona un fragmento y guárdalo como cita: sale una tarjeta de
  1200×800 con el texto, el autor y el libro, descargable en PNG. Las citas
  quedan marcadas con ★ y salen aparte en la exportación.
- **Exporta a `.eridu` o Markdown.** El `.eridu` es el respaldo completo (JSON
  con extensión propia); el Markdown deja las notas listas para pegar en un
  trabajo, con cita textual, capítulo y nota.
- **Reabrir con un clic.** Al elegir un libro el navegador recuerda el archivo;
  la próxima vez basta pulsar la tarjeta de la estantería, sin volver a buscarlo.
- **Tres idiomas.** Español, English y 简体中文, con detección automática del
  idioma del dispositivo. La tuerca de la portada cambia idioma y tema.
- **Dos personalidades.** *Papel* (claro): textura de papel verjurado, cinta
  washi, esquinas dobladas y sombra de lomo. *Grafito* (oscuro): metal cepillado,
  remaches, testigos luminosos y franjas de advertencia.

## Empezar

```bash
npm install
npm run dev      # http://localhost:5177
```

```bash
npm run build    # dist/
npm run preview
npm test         # 27 pruebas de datos, i18n y exportación
```

Requisitos: Node 20+.

## Cómo se guardan los datos

| Qué | Dónde | Por qué |
| --- | --- | --- |
| Notas, progreso y metadatos de cada libro | **IndexedDB** (`open-reader/books`) | sin el tope de 5 MB de localStorage |
| Ajustes e índice de la estantería | `localStorage` (`openreader.v1.*`) | son pequeños y se leen al arrancar |
| Archivo del libro (handle) | **IndexedDB** (`open-reader/handles`) | permite reabrirlo con un clic |
| El libro en sí | nunca se guarda | el lector solo lee el archivo |

1. Al abrir un archivo se calcula un identificador con SHA-256 de sus primeros
   4 MB más su tamaño.
2. Bajo ese id se guardan las anotaciones y la posición de lectura.
3. Los registros que quedaron en `localStorage` de versiones anteriores se
   migran a IndexedDB la primera vez que se abren.
4. **Ajustes → Datos** muestra cuánto ocupa el sitio (`navigator.storage.estimate`)
   y la app pide almacenamiento persistente para que el navegador no borre las
   notas cuando el disco se llene.
5. **Exportar `.eridu`** produce un JSON con todo, para mover las notas entre
   equipos o antes de limpiar los datos del navegador.

### Reabrir con un clic

Donde existe la File System Access API (Chrome, Edge, Opera) el lector usa
`showOpenFilePicker` y guarda el `FileSystemFileHandle`; al pulsar la tarjeta
solo pide permiso de lectura una vez. En Firefox y Safari cae al selector de
archivos clásico y el clic vuelve a abrir el diálogo.

## Atajos

| Tecla | Acción |
| --- | --- |
| `←` `→` / `PageUp` `PageDown` / `Espacio` | Pasar página |
| `Inicio` / `Fin` | Principio / final del libro |
| `Ctrl+F` | Buscar en el libro |
| `b` | Marcar la página actual |
| `f` | Pantalla completa |
| `t` | Cambiar tema |
| `Esc` | Cerrar el panel flotante |

## App de escritorio (Windows)

Ya hay un binario listo en el repo: **`release/OpenReader.exe`** (5,3 MB,
portable, sin instalación). Doble clic y abre el lector en su propia ventana con
WebView2.

Para reconstruirlo:

```bash
npm run app:build
```

Genera `src-tauri/target/release/open-reader.exe`, que es el que se copia a
`release/`. El workflow `.github/workflows/windows-app.yml` también lo compila en
cada tag `v*` y lo adjunta al release.

Requiere Rust y las Build Tools de Visual Studio **solo para compilar**. Para
usar el `.exe` no hace falta nada.

## Despliegue

El resultado es estático: sirve `dist/` con cualquier servidor. En `deploy/` hay
configuración para nginx, Caddy y Docker; el despliegue concreto en
`open-reader.eridu.top` está en [`deploy/eridu.md`](deploy/eridu.md).

```bash
docker build -t open-reader .
docker run -p 8080:80 open-reader
```

Actualizar el sitio en eridu (el NUC no aguanta `docker build`):

```bash
npm run build
scp -r dist atopnuc@192.168.1.100:/home/atopnuc/sitios/open-reader/
ssh atopnuc@192.168.1.100 'chmod -R a+rX ~/sitios/open-reader/dist'
```

### Seguridad: usa una CSP

Un EPUB puede traer JavaScript y se renderiza en un iframe del mismo origen.
Sin `Content-Security-Policy`, un libro malicioso podría ejecutar código en tu
página. `deploy/nginx.conf` y `deploy/Caddyfile` ya incluyen esta cabecera:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; frame-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'
```

`static.cloudflareinsights.com` está permitido en `script-src` porque Cloudflare
inyecta su beacon en el HTML proxificado; `connect-src` sigue en `'self'`.

## Apoyar el proyecto

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jdsalasca)

El pie de la portada tiene el botón **Apóyanos en Ko-fi**. El enlace se configura
en tiempo de compilación:

```bash
cp .env.example .env
# VITE_DONATE_URL=https://ko-fi.com/tu-usuario
npm run build
```

O se cambia directamente en `src/lib/links.ts`. Sirve cualquier URL de donación:
Ko-fi, Buy Me a Coffee, GitHub Sponsors o PayPal.me.

> **Desde Colombia:** Ko-fi paga directo a tu **PayPal** (Ko-fi nunca retiene el
> dinero), y PayPal permite retirar a un banco colombiano. **Buy Me a Coffee ya
> no paga por PayPal**, solo por Stripe, que no opera en Colombia; por eso el
> botón usa Ko-fi.

## Estructura

```
src/
  lib/         tipos, almacenamiento (IndexedDB), huella del libro, handles,
               exportación a Markdown, tarjeta de cita, CSS del libro
  i18n/        diccionarios es/en/zh y contexto
  reader/      hook de foliate, pantalla de lectura, panel, popover, diálogos
  shelf/       estantería, ajustes rápidos y zona de arrastre
  styles/      SCSS: tokens, base, shelf, reader, panels, gutter, popover, decor
  vendor/      foliate-js (MIT) con tres parches documentados
tests/         vitest: almacenamiento, índice, Markdown, handles
```

### Parches sobre foliate-js

El motor se copia tal cual en `src/vendor/foliate/` salvo tres cambios, marcados
con `patch (open-reader)`:

1. `fixed-layout.js` expone `index` y `overlayer` en `getContents()` y crea la
   capa de anotaciones dentro de la página. Sin esto no se puede resaltar un PDF.
2. `pdf.js` mantiene el documento a escala CSS y rasteriza solo el canvas a
   resolución de pantalla, para que selección y anotaciones compartan el mismo
   sistema de coordenadas. También sirve el visor como página única.
3. `pdf.js` resuelve sus recursos (`worker`, `cmaps`, `standard_fonts`) desde
   `public/pdfjs/`, que `scripts/copy-pdfjs-assets.mjs` rellena al instalar.

## Límites conocidos

- Sin DRM: los libros protegidos de tiendas no abren.
- Las notas son locales por navegador; no hay sincronización entre dispositivos
  (el `.eridu` es el puente).
- En PDF la selección depende de la capa de texto que traiga el archivo; un PDF
  escaneado sin OCR no se puede resaltar.
- La búsqueda dentro del libro no está disponible en PDF.

## Licencia

MIT. Las dependencias conservan su licencia; ver `THIRD-PARTY.md`.
