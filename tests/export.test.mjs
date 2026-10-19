import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

test('portable export embeds the app and data, validates its script, and blocks network connections', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'still-here-export-'));
  try {
    const target = join(scratch, 'preview.html');
    execFileSync(process.execPath, [new URL('../scripts/export.mjs', import.meta.url).pathname, target]);
    const html = await readFile(target, 'utf8');
    const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script);
    assert.ok(script.includes('const EMBEDDED_DATA ='));
    assert.ok(!script.includes("fetch('./data/"));
    assert.ok(!/^import /m.test(script));
    assert.ok(!html.includes('href="./styles.css"'));
    assert.ok(!html.includes('src="./app.js"'));
    assert.ok(html.includes("connect-src 'none'"));
    const hash = createHash('sha256').update(script).digest('base64');
    assert.ok(html.includes(`'sha256-${hash}'`));
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: script });
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
