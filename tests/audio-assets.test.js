import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = new URL('../', import.meta.url);
const manifestPath = new URL('../audio/manifest.json', import.meta.url);

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

test('production audio manifest contains the generated 0-10 Northern explicit pack', () => {
  const manifest = readManifest();

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.entries.length, 11);
  assert.deepEqual(manifest.entries.map((entry) => entry.value), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(manifest.entries.map((entry) => entry.audioStyle)).size, 1);
  assert.equal(manifest.entries[0].audioStyle, 'northern-explicit');
});

test('production audio manifest only references validated local wav files', () => {
  const manifest = readManifest();

  for (const entry of manifest.entries) {
    assert.match(entry.file, /^audio\/northern-explicit\/[0-9]+\.wav$/);
    assert.equal(entry.format, 'wav');
    assert.equal(entry.dialect, 'Northern Vietnamese');
    assert.equal(typeof entry.text, 'string');
    assert.ok(entry.text.length > 0);
    assert.ok(entry.durationSeconds > 0);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);

    const filePath = path.join(repoRoot.pathname, entry.file);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 44, `${entry.file} should contain audio frames`);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    assert.equal(digest, entry.sha256);
  }
});
