import { fileURLToPath } from 'url';
import fs from 'fs';
import { minify } from 'terser';

const mangle = {
	properties: {
		regex: /^_/,
	}
};


const moduleInputFile = fileURLToPath(new URL('../dist/nobl.mjs', import.meta.url));
const moduleOutputFile = fileURLToPath(new URL('../dist/nobl.min.mjs', import.meta.url));
let result = await minify(fs.readFileSync(moduleInputFile, 'utf-8'), {module: true, mangle});
fs.writeFileSync(moduleOutputFile, result.code, 'utf8');

const iifeInputFile = fileURLToPath(new URL('../dist/nobl.js', import.meta.url));
const iifeOutputFile = fileURLToPath(new URL('../dist/nobl.min.js', import.meta.url));
let iifeResult = await minify(fs.readFileSync(iifeInputFile, 'utf-8'), {mangle});
fs.writeFileSync(iifeOutputFile, iifeResult.code, 'utf8');
