import { defineConfig, InputOptions, OutputOptions } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const plugins: InputOptions['plugins'] = [];
const output: OutputOptions = {};
let input;

const tsPlugin = typescript({
	sourceMap: false,
	exclude: ['rollup.config.ts', 'src/__tests__/**'],
});

switch (process.env.BUILD) {
	case 'base': {
		plugins.push(tsPlugin);
		input = 'src/Nobl.ts';
		output.file = 'dist/Nobl.mjs';
		break;
	}
	case 'types': {
		plugins.push(dts());
		input = 'dist/Nobl.d.ts';
		output.file = 'dist/Nobl.d.ts';
		break;
	}
	case 'iife': {
		plugins.push(tsPlugin);
		input = 'src/iife.ts';
		output.file = 'dist/Nobl.js';
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
