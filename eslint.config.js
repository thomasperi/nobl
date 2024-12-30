import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);

// import stylisticTs from '@stylistic/eslint-plugin-ts';
// import parserTs from '@typescript-eslint/parser';
// 
// export default [
// 	{
// 		plugins: {
// 			'@stylistic/ts': stylisticTs,
// 		},
// 		files: ["**/*.ts"],
// 		languageOptions: {
// 			parser: parserTs,
// 		},
// 		rules: {
// 			// See https://eslint.style/packages/ts
// 			'@stylistic/ts/indent': ['error', 'tab'],
// 			'@stylistic/ts/semi': 'error',
// 		},
// 	},
// ];
