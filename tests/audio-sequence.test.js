import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAudioChunkEntry,
  createAudioEntry,
  createChunkSequenceForQuestion,
  findAudioEntryForQuestion,
} from '../src/audio-manifest.js';

test('builds Northern B-plan chunk sequences for explicit and compact thousands', () => {
  assert.deepEqual(
    createChunkSequenceForQuestion({ value: 2026, audioStyle: 'northern-explicit' }).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
    })),
    [
      { id: 'northern-thousand-prefix-2', text: 'hai nghìn' },
      { id: 'northern-explicit-low-remainder-26', text: 'không trăm hai mươi sáu' },
    ],
  );

  assert.deepEqual(
    createChunkSequenceForQuestion({ value: 1005, audioStyle: 'northern-compact' }).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
    })),
    [
      { id: 'northern-thousand-prefix-1', text: 'một nghìn' },
      { id: 'northern-compact-low-digit-5', text: 'lẻ năm' },
    ],
  );
});

test('routes compact thousand remainders through the intended B-plan chunks', () => {
  assert.deepEqual(
    createChunkSequenceForQuestion({ value: 1026, audioStyle: 'northern-compact' }).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
    })),
    [
      { id: 'northern-thousand-prefix-1', text: 'một nghìn' },
      { id: 'northern-under-1000-26', text: 'hai mươi sáu' },
    ],
  );

  assert.deepEqual(
    createChunkSequenceForQuestion({ value: 1234, audioStyle: 'northern-compact' }).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
    })),
    [
      { id: 'northern-thousand-prefix-1', text: 'một nghìn' },
      { id: 'northern-under-1000-234', text: 'hai trăm ba mươi bốn' },
    ],
  );
});

test('keeps a future Southern audio interface without changing the Northern default', () => {
  assert.deepEqual(
    createChunkSequenceForQuestion({ value: 2026, audioStyle: 'southern-explicit' }).map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      accent: chunk.accent,
    })),
    [
      { id: 'southern-thousand-prefix-2', text: 'hai ngàn', accent: 'southern' },
      { id: 'southern-explicit-low-remainder-26', text: 'không trăm hai mươi sáu', accent: 'southern' },
    ],
  );
});

test('finds a complete chunk sequence when full-number audio is not present', () => {
  const question = { value: 2026, audioStyle: 'northern-explicit', answer: { primary: 'hai nghìn không trăm hai mươi sáu' } };
  const chunks = createChunkSequenceForQuestion(question).map((chunk) => createAudioChunkEntry({
    ...chunk,
    format: 'wav',
    durationSeconds: 1,
    sha256: 'a'.repeat(64),
  }));

  const entry = findAudioEntryForQuestion({ chunks }, question);

  assert.equal(entry.isSequence, true);
  assert.equal(entry.audioStyle, 'northern-explicit');
  assert.deepEqual(entry.files, [
    'audio/chunks/northern/thousand-prefix/2.wav',
    'audio/chunks/northern/explicit-low-remainder/26.wav',
  ]);
  assert.equal(entry.text, question.answer.primary);
});

test('prefers a full-number manifest entry over chunk fallback for compatibility', () => {
  const question = { value: 2026, audioStyle: 'northern-explicit', answer: { primary: 'hai nghìn không trăm hai mươi sáu' } };
  const chunks = createChunkSequenceForQuestion(question).map((chunk) => createAudioChunkEntry({
    ...chunk,
    format: 'wav',
  }));
  const fullEntry = createAudioEntry({
    value: 2026,
    audioStyle: 'northern-explicit',
    text: question.answer.primary,
    format: 'wav',
  });

  const entry = findAudioEntryForQuestion({ entries: [fullEntry], chunks }, question);

  assert.equal(entry, fullEntry);
  assert.equal(entry.isSequence, undefined);
  assert.equal(entry.file, 'audio/northern-explicit/2026.wav');
});

test('falls back to chunk lookup when manifest entries is malformed', () => {
  const question = { value: 2026, audioStyle: 'northern-explicit', answer: { primary: 'hai nghìn không trăm hai mươi sáu' } };
  const chunks = createChunkSequenceForQuestion(question).map((chunk) => createAudioChunkEntry({
    ...chunk,
    format: 'wav',
  }));

  const entry = findAudioEntryForQuestion({ entries: {}, chunks }, question);

  assert.equal(entry.isSequence, true);
  assert.deepEqual(entry.files, [
    'audio/chunks/northern/thousand-prefix/2.wav',
    'audio/chunks/northern/explicit-low-remainder/26.wav',
  ]);
});

test('does not expose a chunk sequence unless every referenced chunk has a safe local file', () => {
  const question = { value: 2026, audioStyle: 'northern-explicit', answer: { primary: 'hai nghìn không trăm hai mươi sáu' } };
  const [first, second] = createChunkSequenceForQuestion(question);

  assert.equal(findAudioEntryForQuestion({
    chunks: [
      createAudioChunkEntry({ ...first, format: 'wav' }),
      { ...createAudioChunkEntry({ ...second, format: 'wav' }), file: 'audio/chunks/northern/under-1000/26.wav' },
    ],
  }, question), null);

  assert.equal(findAudioEntryForQuestion({
    chunks: [
      createAudioChunkEntry({ ...first, format: 'wav' }),
      { ...createAudioChunkEntry({ ...second, format: 'wav' }), file: 'https://example.com/bad.wav' },
    ],
  }, question), null);
});
