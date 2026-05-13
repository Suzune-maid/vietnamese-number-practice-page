import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles/main.css', import.meta.url), 'utf8');

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

test('mode selector uses task-specific names and keeps typing last', () => {
  const optionMatches = [...html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
  const modeOptions = optionMatches.slice(0, 4).map((match) => [match[1], match[2]]);

  assert.deepEqual(modeOptions, [
    ['flashcard', '閃卡'],
    ['choice', '看數字選越南語'],
    ['listening-choice', '聽聲音選阿拉伯數字'],
    ['typing', '輸入練習'],
  ]);
  assert.doesNotMatch(html, />選擇題</);
  assert.doesNotMatch(html, />聽力選擇</);
});

test('audio playback button uses short copy', () => {
  assert.match(html, /id="play-audio-button"[^>]*>播放語音<\/button>/);
  assert.match(appSource, /textContent = '播放語音'/);
  assert.doesNotMatch(html, /播放 Gemini TTS/);
  assert.doesNotMatch(appSource, /播放 Gemini TTS/);
});

test('feedback status has top spacing from the answer controls', () => {
  assert.match(css, /\.feedback\s*\{[^}]*margin-top:\s*1rem/s);
});

test('listening-choice asks users to select Arabic numerals', () => {
  assert.match(appSource, /請聽聲音後選阿拉伯數字/);
  assert.doesNotMatch(appSource, /請聽音檔後選答案/);
  assert.match(appSource, /question\.mode === 'listening-choice'\s*\? String\(value\)\s*: formatChoiceOption/s);
});

test('on-page keyboard buttons do not refocus the input after every tap', () => {
  assert.doesNotMatch(appSource, /input\.focus\(\)/);
});
