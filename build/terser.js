import { fileURLToPath } from 'url';
import fs from 'fs';
import { minify } from 'terser';

const inputFile = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));
const outputFile = fileURLToPath(new URL('../dist/index.min.mjs', import.meta.url));
let result = await minify(fs.readFileSync(inputFile, 'utf-8'));
fs.writeFileSync(outputFile, result.code, 'utf8');

const iifeInputFile = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const iifeOutputFile = fileURLToPath(new URL('../dist/index.min.js', import.meta.url));
let iifeResult = await minify(fs.readFileSync(iifeInputFile, 'utf-8'));
fs.writeFileSync(iifeOutputFile, iifeResult.code, 'utf8');
