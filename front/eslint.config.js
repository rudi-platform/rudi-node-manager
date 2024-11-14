/* eslint-disable no-undef */
const globals = require('globals')

const js = require('@eslint/js')
const cypress = require('eslint-plugin-cypress')
const eslintReact = require('eslint-plugin-react')
const eslintOnlyWarn = require('eslint-plugin-only-warn')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const unusedImports = require('eslint-plugin-unused-imports')

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      '**/*.pub',
      '**/*.spec.js',
      '**/*.test.js',
      '**/node_modules/**',
      '**/tests/**',
      'build/**',
      'cypress/**',
      'dev/**',
    ],
    languageOptions: {
      globals: { ...globals.browser, require: true, process: true },
      ecmaVersion: 'latest',
    },
    rules: {
      'arrow-body-style': 'off',
      'comma-dangle': ['error', 'only-multiline'],
      complexity: ['warn', { max: 20 }],
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
      'cypress/no-pause': 'error',
      indent: 'off',
      'no-await-in-loop': 'error',
      'no-console': 'off',
      'no-dupe-keys': 'error',
      'no-empty': 'error',
      'no-extend-native': ['error', { exceptions: ['RegExp'] }],
      'no-invalid-regexp': 'error',
      'no-redeclare': 'error',
      'no-return-assign': 'error',
      'no-self-assign': 'warn',
      'no-self-compare': 'warn',
      'no-undef': 'error',
      'no-unused-vars': 'off',
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      'prefer-arrow-callback': 'warn',
      'prettier/prettier': 'warn',
      'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^(_|fun|mod|err)$',
          args: 'after-used',
          argsIgnorePattern: '^(_|req|reply|res|next|fun|mod|err)$',
        },
      ],
    },
    plugins: { react: eslintReact, 'only-warn': eslintOnlyWarn, 'unused-imports': unusedImports, cypress },
    settings: { react: { version: 'detect' } },
  },
  eslintPluginPrettierRecommended,
]
