import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const plugins = [];
const output = {};
let input;

const tsPlugin = typescript({
	sourceMap: false,
	exclude: ['src/__tests__/**'],
});

switch (process.env.BUILD) {
	case 'base': {
		plugins.push(tsPlugin);
		input = 'src/nobl.ts';
		output.file = 'dist/nobl.mjs';
		break;
	}
	case 'types': {
		plugins.push(dts());
		input = 'dist/nobl.d.ts';
		output.file = 'dist/nobl.d.ts';
		break;
	}
	case 'iife': {
		plugins.push(tsPlugin);
		input = 'src/iife.ts';
		output.file = 'dist/nobl.js';
		output.format = 'iife';
		break;
	}
}

const config = defineConfig({
  input,
  output,
  plugins,
});

export default config;
