# Open Reader

Lector de libros en el navegador. Abre el archivo que quieras —**EPUB, MOBI,
AZW3, FB2, CBZ o PDF**—, resalta en cinco colores, subraya, tacha, deja notas al
margen, marca páginas, busca dentro del libro y guarda citas. El archivo nunca
sale de tu equipo: no hay cuentas, no hay servidor y no hay subida.

En vivo: **https://open-library.eridu.top** · Escritorio: `release/OpenReader.exe`

- **Un solo motor para todos los formatos.** [foliate-js](https://github.com/johnfactotum/foliate-js)
  renderiza texto reflowable y páginas fijas, con capa de texto real en los PDF
  (por eso se puede seleccionar y resaltar).
- **Notas y marcadores.** Resaltado, subrayado, ondulado y tachado, en ámbar,
  óxido, salvia, cielo e iris. Cada marca admite una nota escrita.
- **Notas al margen.** Las notas del capítulo aparecen como tarjetas al lado de
  la página, con su color, su cita y un «me gusta». Se apagan en Ajustes para
  una lectura sin interrupciones.
- **Buscar en el libro.** `Ctrl+F`, resultados agrupados por capítulo con la
  frase y el salto exacto al pasaje.
- **Citas.** Selecciona un fragmento y guárdalo como cita: sale una tarjeta con
  el texto, el autor y el libro, descargable en PNG. Las citas quedan marcadas
  con ★ y salen aparte en la exportación.
- **Tres idiomas.** Español, English y 简体中文, con detección automática del
  idioma del dispositivo. La tuerca de la portada cambia idioma y tema; en el
  lector está en Ajustes.
- **Exporta a `.eridu` o Markdown.** El `.eridu` es el respaldo completo (JSON
  con extensión propia); el Markdown deja las notas listas para pegar en un
  trabajo, con cita textual, capítulo y nota.
- **Sin backend.** Las anotaciones viven en `localStorage`, asociadas a una
  huella SHA-256 del archivo. Abres el mismo libro y todo sigue ahí.
- **Dos temas.** *Papel* (claro) y *Grafito* (oscuro), ambos con la misma
  identidad: papel cálido, reglas de acero, tipografía monoespaciada.
- **Pantalla completa**, modo scroll o paginado, tamaño de letra, interlineado,
  ancho de columna, justificado, partición de palabras y tipografía de lectura.

## Empezar

```bash
npm install
npm run dev      # http://localhost:5177
```

```bash
npm run build    # dist/
npm run preview
npm test         # 14 pruebas de la capa de datos y del tema de lectura
```

Requisitos: Node 20+.

## Cómo se guardan las notas

1. Al abrir un archivo se calcula un identificador con SHA-256 de sus primeros
   4 MB más su tamaño.
2. Bajo `openreader.v1.book.<id>` se guardan las anotaciones y la posición de
   lectura.
3. La estantería (`openreader.v1.library`) recuerda título, formato y progreso.
4. **Exportar `.eridu`** produce un JSON con todo (`format: "eridu"`), para
   mover las notas entre equipos o antes de limpiar los datos del navegador.
   Se importa igual, y también acepta los `.json` de versiones anteriores.

No se guarda el archivo del libro, solo sus marcas. Si abres el mismo PDF desde
otra ruta, el identificador sigue coincidiendo.

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

## Despliegue

El resultado es estático: sirve `dist/` con cualquier servidor. En `deploy/`
hay configuración lista para nginx, Caddy y Docker. El despliegue concreto en
`open-library.eridu.top` está en [`deploy/eridu.md`](deploy/eridu.md).

```bash
docker build -t open-reader .
docker run -p 8080:80 open-reader
```

### Seguridad: usa una CSP

Un EPUB puede traer JavaScript y se renderiza en un iframe del mismo origen.
Sin `Content-Security-Policy`, un libro malicioso podría ejecutar código en tu
página. `deploy/nginx.conf` y `deploy/Caddyfile` ya incluyen esta cabecera:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; frame-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'
```

Si prefieres no depender de Google Fonts, quita el `<link>` de `index.html` e
instala las tipografías con `@fontsource`.

## App de escritorio (Windows)

Ya hay un binario listo en el repo: **`release/OpenReader.exe`** (5 MB, portable,
sin instalación). Doble clic y abre el lector en su propia ventana con WebView2.

Para reconstruirlo:

```bash
npm run app:build
```

Genera `src-tauri/target/release/open-reader.exe`, que es el que se copia a
`release/`. El workflow `.github/workflows/windows-app.yml` también lo compila en
cada tag `v*` y lo adjunta al release.

Requiere Rust y las Build Tools de Visual Studio **solo para compilar**. Para
usar el `.exe` no hace falta nada.

## Estructura

```
src/
  lib/         tipos, almacenamiento, huella del libro, CSS del libro
  reader/      hook de foliate, pantalla de lectura, panel, popover, diálogo
  shelf/       estantería y zona de arrastre
  styles/      SCSS con tokens de tema (papel / grafito)
  vendor/      foliate-js (MIT) con tres parches documentados
tests/         vitest sobre la capa de datos
```

### Parches sobre foliate-js

El motor se copia tal cual en `src/vendor/foliate/` salvo tres cambios, marcados
con `patch (open-reader)`:

1. `fixed-layout.js` expone `index` y `overlayer` en `getContents()` y crea la
   capa de anotaciones dentro de la página. Sin esto no se puede resaltar un PDF
   (upstream lo deja como TODO).
2. `pdf.js` mantiene el documento a escala CSS y rasteriza solo el canvas a
   resolución de pantalla, para que selección y anotaciones compartan el mismo
   sistema de coordenadas. También sirve el visor como página única.
3. `pdf.js` resuelve sus recursos (`worker`, `cmaps`, `standard_fonts`) desde
   `public/pdfjs/`, que `scripts/copy-pdfjs-assets.mjs` rellena al instalar.

## Límites conocidos

- Sin DRM: los libros protegidos de tiendas no abren.
- Las notas son locales por navegador; no hay sincronización entre dispositivos.
- En PDF la selección depende de la capa de texto que traiga el archivo; un PDF
  escaneado sin OCR no se puede resaltar.

## Licencia

MIT. Las dependencias conservan su licencia; ver `THIRD-PARTY.md`.
