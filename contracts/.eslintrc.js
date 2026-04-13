module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.ts'],
      },
    ],
  },
  overrides: [
    {
      files: ['__test__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['*.algo.ts'],
      rules: {
        'lines-between-class-members': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'import/no-extraneous-dependencies': 'off',
        'object-shorthand': 'off',
        'class-methods-use-this': 'off',
        'no-undef': 'off',
        'max-classes-per-file': 'off',
        'no-bitwise': 'off',
        'operator-assignment': 'off',
        'prefer-template': 'off',
        'prefer-destructuring': 'off',
        'linebreak-style': 'off', // Disable line ending checks for TEALScript files
      },
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'no-continue': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-plusplus': 'off',
        camelcase: 'off',
        'no-use-before-define': 'off',
        'no-promise-executor-return': 'off',
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        'no-empty': 'off',
        'no-undef': 'off',
      },
    },
  ],
};
