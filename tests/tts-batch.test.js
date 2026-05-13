import test from 'node:test';
import assert from 'node:assert/strict';

import { createTtsBatchRecords, geminiVietnameseStyle } from '../src/tts-batch.js';

test('creates OpenRouter Gemini TTS batch records for explicit Northern numbers', () => {
  assert.deepEqual(createTtsBatchRecords({ min: 0, max: 2, audioStyle: 'northern-explicit' }), [
    { id: '0', text: 'không' },
    { id: '1', text: 'một' },
    { id: '2', text: 'hai' },
  ]);
});

test('creates compact thousand transcripts when requested', () => {
  assert.deepEqual(createTtsBatchRecords({ min: 2026, max: 2026, audioStyle: 'northern-compact' }), [
    { id: '2026', text: 'hai nghìn hai mươi sáu' },
  ]);
});

test('rejects unsupported batch ranges before a paid TTS call is attempted', () => {
  assert.throws(
    () => createTtsBatchRecords({ min: -1, max: 2, audioStyle: 'northern-explicit' }),
    /min and max must be integers from 0 to 9999/,
  );
  assert.throws(
    () => createTtsBatchRecords({ min: 10, max: 2, audioStyle: 'northern-explicit' }),
    /min must be less than or equal to max/,
  );
});

test('documents the Northern Vietnamese style prompt used for language-learning clips', () => {
  assert.match(geminiVietnameseStyle, /Natural Northern Vietnamese pronunciation/);
  assert.match(geminiVietnameseStyle, /Read the number exactly once/);
});
