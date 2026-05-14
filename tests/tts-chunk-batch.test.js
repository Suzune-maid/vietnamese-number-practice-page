import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  CHUNK_KINDS,
  createAllTtsChunkBatchRecords,
  createTtsChunkBatchRecords,
  writeTtsChunkBatchFiles,
} from '../src/tts-chunk-batch.js';

test('creates the complete Northern B-plan chunk batches with stable counts', () => {
  const batches = createAllTtsChunkBatchRecords({ accent: 'northern' });

  assert.deepEqual(Object.keys(batches), CHUNK_KINDS);
  assert.equal(batches['under-1000'].length, 1000);
  assert.equal(batches['thousand-prefix'].length, 9);
  assert.equal(batches['explicit-low-remainder'].length, 99);
  assert.equal(batches['compact-low-digit'].length, 9);

  const total = Object.values(batches).reduce((sum, records) => sum + records.length, 0);
  assert.equal(total, 1117);
});

test('creates expected representative Northern chunk transcripts', () => {
  const under1000 = createTtsChunkBatchRecords({ accent: 'northern', kind: 'under-1000' });
  const thousandPrefix = createTtsChunkBatchRecords({ accent: 'northern', kind: 'thousand-prefix' });
  const explicitLowRemainder = createTtsChunkBatchRecords({ accent: 'northern', kind: 'explicit-low-remainder' });
  const compactLowDigit = createTtsChunkBatchRecords({ accent: 'northern', kind: 'compact-low-digit' });

  assert.deepEqual(under1000[0], { id: '0', text: 'không' });
  assert.deepEqual(under1000[105], { id: '105', text: 'một trăm lẻ năm' });
  assert.deepEqual(thousandPrefix[1], { id: '2', text: 'hai nghìn' });
  assert.deepEqual(explicitLowRemainder[25], { id: '26', text: 'không trăm hai mươi sáu' });
  assert.deepEqual(compactLowDigit[4], { id: '5', text: 'lẻ năm' });
});

test('writes one numeric-id JSONL batch per chunk kind', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'vn-tts-chunks-'));
  const summary = await writeTtsChunkBatchFiles({ accent: 'northern', outputDir });

  assert.equal(summary.totalRecords, 1117);
  assert.equal(summary.files.length, 4);

  const explicit = summary.files.find((item) => item.kind === 'explicit-low-remainder');
  assert.equal(explicit.recordCount, 99);
  assert.equal(explicit.path, path.join(outputDir, 'explicit-low-remainder.jsonl'));

  const lines = (await readFile(explicit.path, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual(lines.at(25), { id: '26', text: 'không trăm hai mươi sáu' });
});

test('rejects unsupported chunk accents and kinds before paid TTS generation', () => {
  assert.throws(() => createTtsChunkBatchRecords({ accent: 'southern', kind: 'under-1000' }), /unsupported accent/i);
  assert.throws(() => createTtsChunkBatchRecords({ accent: 'northern', kind: 'full-number' }), /unsupported chunk kind/i);
});
