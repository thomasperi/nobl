import stylisticTs from '@stylistic/eslint-plugin-ts';
import parserTs from '@typescript-eslint/parser';

export default [
	{
		plugins: {
			'@stylistic/ts': stylisticTs,
		},
		files: ["**/*.ts"],
		languageOptions: {
			parser: parserTs,
		},
		rules: {
			// See https://eslint.style/packages/ts
			'@stylistic/ts/indent': ['error', 'tab'],
			'@stylistic/ts/semi': 'error',
		},
	},
];
