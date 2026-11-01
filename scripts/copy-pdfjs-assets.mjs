import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// pdf.js needs its worker, the CMaps and the base-14 font data at runtime.
// They ship inside pdfjs-dist, so we copy them next to the app on install/build
// instead of committing ~4 MB of binaries.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', 'pdfjs-dist')
const to = join(root, 'public', 'pdfjs')

if (!existsSync(from)) {
  console.warn('[pdfjs] node_modules/pdfjs-dist missing, run npm install first')
  process.exit(0)
}

mkdirSync(to, { recursive: true })

const version = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8')).version

for (const [src, dest] of [
  ['build/pdf.worker.mjs', 'pdf.worker.mjs'],
  ['cmaps', 'cmaps'],
  ['standard_fonts', 'standard_fonts'],
]) {
  cpSync(join(from, src), join(to, dest), { recursive: true, force: true })
}

writeFileSync(join(to, 'VERSION'), version)
console.log(`[pdfjs] assets for ${version} copied to public/pdfjs`)
