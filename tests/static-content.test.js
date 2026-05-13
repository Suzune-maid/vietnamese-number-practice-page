import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

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

test('flashcard mode has a no-score progress note', () => {
  assert.match(html, /id="progress-note"/);
  assert.match(html, /閃卡模式不計分/);
});

test('audio playback feedback never reveals the answer text while playing', () => {
  assert.doesNotMatch(appSource, /正在播放：/);
  assert.match(appSource, /請聽音檔後作答/);
});

test('listening-choice prompt asks for an answer instead of a number label', () => {
  assert.match(appSource, /請聽音檔後選答案/);
  assert.doesNotMatch(appSource, /請聽音檔後選數字/);
});
