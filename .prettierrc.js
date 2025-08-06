module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Line formatting
  printWidth: 100,
  endOfLine: 'lf',

  // Bracket formatting
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // HTML/JSX specific
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: true,

  // Special file overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      options: {
        // Slightly more relaxed for React components
        printWidth: 100,
        jsxSingleQuote: true,
        bracketSameLine: false,
      },
    },
    {
      files: ['apps/backend/**/*.ts'],
      options: {
        // Backend can handle longer lines
        printWidth: 120,
      },
    },
    {
      files: ['packages/**/*.ts'],
      options: {
        // Shared packages should be more compact
        printWidth: 90,
      },
    },
  ],
};
