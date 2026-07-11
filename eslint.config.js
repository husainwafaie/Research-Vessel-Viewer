import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Only the classic hook rules: the v7 "recommended" preset adds the
      // React Compiler purity/immutability rules, which are incompatible
      // with react-three-fiber's model — useFrame callbacks mutate three.js
      // objects (camera, materials, buffers) every frame BY DESIGN, and
      // particle systems seed buffers with randomness inside useMemo.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // R3F components legitimately export helper functions alongside
      // components (e.g. applyHullCaustics) — warn instead of error
      'react-refresh/only-export-components': 'warn',
      // Scene code passes unused-prefix args in useFrame callbacks
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
