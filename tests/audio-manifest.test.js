import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAudioEntry,
  createAudioId,
  expectedAudioPath,
  findAudioEntryForQuestion,
  summarizeManifestAvailability,
} from '../src/audio-manifest.js';

test('creates stable path-safe audio ids and GitHub Pages relative paths', () => {
  assert.equal(createAudioId(25, 'northern-explicit'), 'northern-explicit-25');
  assert.equal(expectedAudioPath(25, 'northern-explicit', 'mp3'), 'audio/northern-explicit/25.mp3');
});

test('creates manifest entries that preserve the spoken transcript', () => {
  assert.deepEqual(createAudioEntry({
    value: 105,
    audioStyle: 'northern-explicit',
    text: 'một trăm lẻ năm',
    format: 'mp3',
    durationSeconds: 1.72,
    sha256: 'abc123',
  }), {
    id: 'northern-explicit-105',
    value: 105,
    audioStyle: 'northern-explicit',
    dialect: 'Northern Vietnamese',
    text: 'một trăm lẻ năm',
    file: 'audio/northern-explicit/105.mp3',
    format: 'mp3',
    durationSeconds: 1.72,
    sha256: 'abc123',
  });
});

test('finds the exact audio entry for a generated quiz question', () => {
  const manifest = {
    schemaVersion: 1,
    entries: [
      createAudioEntry({ value: 25, audioStyle: 'northern-explicit', text: 'hai mươi lăm' }),
      createAudioEntry({ value: 25, audioStyle: 'northern-compact', text: 'hai mươi lăm' }),
    ],
  };

  const entry = findAudioEntryForQuestion(manifest, { value: 25, audioStyle: 'northern-compact' });

  assert.equal(entry.file, 'audio/northern-compact/25.mp3');
});

test('returns null when manifest is missing or the question has no matching clip', () => {
  assert.equal(findAudioEntryForQuestion(null, { value: 25, audioStyle: 'northern-explicit' }), null);
  assert.equal(findAudioEntryForQuestion({ entries: [] }, { value: 25, audioStyle: 'northern-explicit' }), null);
});

test('ignores manifest entries that point outside same-origin audio assets', () => {
  const question = { value: 25, audioStyle: 'northern-explicit' };
  assert.equal(findAudioEntryForQuestion({
    entries: [{
      value: 25,
      audioStyle: 'northern-explicit',
      file: 'https://example.com/25.mp3',
    }],
  }, question), null);
  assert.equal(findAudioEntryForQuestion({
    entries: [{
      value: 25,
      audioStyle: 'northern-explicit',
      file: '../private/25.mp3',
    }],
  }, question), null);
});

test('summarizes manifest availability for the UI status pill', () => {
  assert.deepEqual(summarizeManifestAvailability(null), {
    loaded: false,
    total: 0,
    message: 'Gemini TTS 音檔：待產生',
  });

  assert.deepEqual(summarizeManifestAvailability({ entries: [
    createAudioEntry({ value: 0, audioStyle: 'northern-explicit', text: 'không' }),
    createAudioEntry({ value: 1, audioStyle: 'northern-explicit', text: 'một' }),
  ] }), {
    loaded: true,
    total: 2,
    message: 'Gemini TTS 音檔：2 筆可用',
  });
});
