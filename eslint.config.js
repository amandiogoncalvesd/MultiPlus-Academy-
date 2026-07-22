import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'build/',
      'coverage/',
      'node_modules/',
      'apps/**',
      'packages/**',
      'supabase/functions/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts', 'vitest.config.ts'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // The existing domain layer still has untyped Supabase responses. These
      // are tracked for incremental replacement with generated database types.
      '@typescript-eslint/no-explicit-any': 'off',
      // Existing UI modules contain legacy imports and state that will be removed
      // during portal refactors. This rule will be enabled after that cleanup.
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
