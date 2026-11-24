// @ts-check
import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import-x'
import n from 'eslint-plugin-n'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

// ── Layer rules (AGENTS.md §2): what each layer may not import ─────────────────

const NO_EXPRESS = {
  name: 'express',
  message: 'Keep Express in *.controller.ts / *.routes.ts.',
}
const NO_HTTP_STATUS = {
  name: '@/shared/consts',
  importNames: ['HttpStatus'],
  message: 'Business logic must not pick HTTP status codes. Throw a domain error instead.',
}
const NO_HTTP = {
  group: ['@/core/http', '@/core/http/*'],
  message: 'HTTP plumbing belongs in *.routes.ts.',
}
// Add your DB driver/ORM here when a project adopts one.
const NO_DB = {
  group: ['@/core/database', '@/core/database/*', 'node:sqlite'],
  message: 'Go through the repository port; only *.repository.<driver>.ts talks to the DB.',
}
const NO_FEATURE_INTERNALS = {
  group: ['@/features/*/*'],
  message: 'Import another feature via its public API (@/features/<name>).',
}

/**
 * (files, ...bans) → a config that bans those imports in those files.
 * NO_FEATURE_INTERNALS is always included: a later `no-restricted-imports` config replaces
 * the earlier one instead of merging, so every layer must repeat it.
 * @param {string[]} files
 * @param {...Record<string, unknown>} bans
 * @returns {import('eslint').Linter.Config}
 */
const restrictImports = (files, ...bans) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: bans.filter((ban) => 'name' in ban),
        patterns: [NO_FEATURE_INTERNALS, ...bans.filter((ban) => 'group' in ban)],
      },
    ],
  },
})

export default defineConfig(
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'eslint.config.mjs'] },

  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      prettier, // last: turns off rules that fight Prettier
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { import: importPlugin, 'unused-imports': unusedImports, n },
    rules: {
      // Correctness
      eqeqeq: 'error',
      curly: ['error', 'multi-line'],
      'no-eval': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/promise-function-async': 'warn',
      '@typescript-eslint/require-await': 'off',
      complexity: ['warn', { max: 15 }],

      // Node — node:sqlite still flagged experimental by the plugin, but works on Node 26
      'n/no-deprecated-api': 'error',
      'n/no-extraneous-import': 'error',
      'n/no-unsupported-features/node-builtins': [
        'error',
        { version: '>=26', ignores: ['sqlite'] },
      ],

      // Logging & env — use the winston logger and the validated `env` (core/config)
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-process-env': 'warn',

      // Imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'warn',
      'import/no-relative-parent-imports': 'error', // `../x` → use the `@/` alias
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'after' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports (auto-fixable)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': ['error', { patterns: [NO_FEATURE_INTERNALS] }],
    },
  },

  // Clean Architecture layers
  restrictImports(
    ['src/features/**/*.{service,entity,repository}.ts'],
    NO_EXPRESS,
    NO_HTTP_STATUS,
    NO_HTTP,
    NO_DB
  ),
  restrictImports(['src/features/**/*.repository.*.ts'], NO_EXPRESS),
  restrictImports(['src/features/**/*.{controller,routes,schema}.ts'], NO_DB),

  // env.ts loads env and logs before the logger exists
  {
    files: ['src/core/config/env.ts'],
    rules: { 'no-console': 'off', 'no-process-env': 'off' },
  },

  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  }
)
