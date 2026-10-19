import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'dist/index.html');
const [html, css, model, app, data, favicon] = await Promise.all(['src/index.html', 'src/styles.css', 'src/model.js', 'src/app.js', 'src/data/ssa-2023.json', 'src/favicon.svg'].map(path => readFile(resolve(root, path), 'utf8')));
let typefaces = await readFile(resolve(root, 'src/typefaces.css'), 'utf8');
const typefaceLicense = await readFile(resolve(root, 'docs/typeface-license.txt'), 'utf8');
typefaces = `/* ${typefaceLicense.replaceAll('*/', '* /')} */\n${typefaces}`;
for (const name of ['instrument-serif-regular.woff2', 'instrument-serif-italic.woff2']) {
  const font = await readFile(resolve(root, 'src/fonts', name));
  typefaces = typefaces.replace(`./fonts/${name}`, `data:font/woff2;base64,${font.toString('base64')}`);
}
const localApp = app.replace(/^import[^\n]+\n/, '').replace(/function loadData\(\) \{[\s\S]*?\n\}\n\nfunction sliderStyle/, `function loadData() {\n  if (!datasetPromise) datasetPromise = Promise.resolve(EMBEDDED_DATA).then(validateDataset);\n  return datasetPromise;\n}\n\nfunction sliderStyle`);
const script = `const EMBEDDED_DATA = ${JSON.stringify(JSON.parse(data))};\n${model.replace(/^export /gm, '')}\n${localApp}`;
if (script.includes("fetch('./data/")) throw new Error('Standalone build retained a network data dependency.');
const hash = createHash('sha256').update(script).digest('base64');
const standalone = html
  .replace('<link rel="stylesheet" href="./typefaces.css">', () => `<style>${typefaces}</style>`)
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>${css}</style>`)
  .replace('<script src="./app.js" type="module"></script>', () => `<script type="module">${script}</script>`)
  .replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"`)
  .replace("script-src 'self';", `script-src 'self' 'sha256-${hash}';`)
  .replace("connect-src 'self';", "connect-src 'none';");
if (!process.argv[2]) await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(target, standalone);
process.stdout.write(`Standalone preview: ${target}\n`);
