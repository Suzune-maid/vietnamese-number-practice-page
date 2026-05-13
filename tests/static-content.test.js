import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('page exposes audio playback controls and dialect notes for the next phase', () => {
  assert.match(html, /id="play-audio-button"/);
  assert.match(html, /id="dialect-note"/);
  assert.match(html, /南越補充/);
});

test('page documents the final Northern chunk audio plan with Southern audio reserved', () => {
  assert.match(html, /北越片段式音檔/);
  assert.match(html, /未來可加南越語音/);
  assert.match(html, /0–999 完整片段/);
});
