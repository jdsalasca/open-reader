// Shim: foliate's pdf.js reads `globalThis.pdfjsLib` after importing ./vendor/pdfjs/pdf.mjs
import * as pdfjsLib from 'pdfjs-dist'

globalThis.pdfjsLib = pdfjsLib

export default pdfjsLib
