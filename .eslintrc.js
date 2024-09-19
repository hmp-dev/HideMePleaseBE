const rules = {
	'testing-library/no-wait-for-side-effects': 0,
	'react-hooks/exhaustive-deps': 0,
	'@typescript-eslint/no-magic-numbers': 0,
	'@typescript-eslint/no-extraneous-class': 0,
	'@typescript-eslint/no-base-to-string': 'off',
	'@typescript-eslint/no-unsafe-member-access': 0,
	'@typescript-eslint/prefer-nullish-coalescing': 0,
	'@typescript-eslint/no-unnecessary-condition': 0,
	'sonarjs/no-duplicate-string': 0,
	'sonarjs/cognitive-complexity': 0,
	'@typescript-eslint/no-dynamic-delete': 0,
	'eslint-comments/no-unlimited-disable': 0,
	'@typescript-eslint/unbound-method': 0,
};

const project = [
	'./tsconfig.json',
	'./backend/tsconfig.json',
	'./world-auth-app/tsconfig.json',
	'./cms/extensions/directus-extension-custom-select/tsconfig.json',
	'./cms/extensions/directus-extension-image-url-preview/tsconfig.json',
	'./cms/extensions/directus-extension-custom-proxy/tsconfig.json',
	'./cms/extensions/directus-extension-dashboards/tsconfig.json',
	'./cms/extensions/directus-extension-community-benefits-inquiry/tsconfig.json',
	'./cms/extensions/directus-extension-user-benefits-inquiry/tsconfig.json',
	'./cms/extensions/directus-extension-user-benefits-aggregate/tsconfig.json',
	'./cms/extensions/directus-extension-locale-date/tsconfig.json',
];

const settings = {
	'import/parsers': {
		'@typescript-eslint/parser': ['.ts', '.tsx'],
	},
	'import/resolver': {
		typescript: {
			project,
		},
	},
};

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project,
	},
	settings,
	ignorePatterns: ['.eslintrc.js', '**/*.js', '*.js'],
	overrides: [
		{
			files: ['./backend/**/*.ts'],
			extends: ['@tool-belt/eslint-config'],
			rules,
		},
	],
};
