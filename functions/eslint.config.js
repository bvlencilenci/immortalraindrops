// eslint.config.js
import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'max-len': ['error', { code: 120 }],
    'quotes': ['error', 'single'],
    'no-unused-vars': ['warn'],
    'indent': ['error', 2],
    'object-curly-spacing': ['error', 'always'],
  },
});
