import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../still-here.html');
const [html, css, model, app, data, favicon] = await Promise.all(['src/index.html', 'dist/styles.css', 'dist/model.js', 'dist/app.js', 'dist/data/ssa-2023.json', 'dist/favicon.svg'].map(path => readFile(resolve(root, path), 'utf8')));
const localApp = app.replace(/^import[^\n]+\n/, '').replace(/function loadData\(\) \{[\s\S]*?\n\}\n\nfunction sliderStyle/, `function loadData() {\n  if (!datasetPromise) datasetPromise = Promise.resolve(EMBEDDED_DATA).then(validateDataset);\n  return datasetPromise;\n}\n\nfunction sliderStyle`);
const script = `const EMBEDDED_DATA = ${JSON.stringify(JSON.parse(data))};\n${model.replace(/^export /gm, '')}\n${localApp}`;
if (script.includes("fetch('./data/")) throw new Error('Standalone build retained a network data dependency.');
const hash = createHash('sha256').update(script).digest('base64');
const standalone = html
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>${css}</style>`)
  .replace('<script src="./app.js" type="module"></script>', () => `<script type="module">${script}</script>`)
  .replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"`)
  .replace("script-src 'self';", `script-src 'self' 'sha256-${hash}';`)
  .replace("connect-src 'self';", "connect-src 'none';");
await writeFile(target, standalone);
if (!process.argv[2]) await writeFile(resolve(root, 'dist/index.html'), standalone);
process.stdout.write(`Standalone preview: ${target}\n`);
