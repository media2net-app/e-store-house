import { readFileSync } from 'node:fs';

const expected = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;`;

const actual = readFileSync(new URL('../postcss.config.mjs', import.meta.url), 'utf8').trim();
if (actual !== expected) {
  console.error('PostCSS config changed. Review it before running the build.');
  process.exitCode = 1;
}
