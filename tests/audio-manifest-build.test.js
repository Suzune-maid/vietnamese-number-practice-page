import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  buildAudioManifest,
  readWavMetadata,
} from '../src/audio-manifest-builder.js';

function createTinyWav({ sampleRate = 24000, frames = 24 } = {}) {
  const dataSize = frames * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

async function writeChunk(root, relativePath) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, createTinyWav({ frames: 240 }));
  return filePath;
}

test('reads WAV metadata and rejects header-only audio', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vn-audio-manifest-'));
  const valid = path.join(root, 'valid.wav');
  const invalid = path.join(root, 'invalid.wav');
  await writeFile(valid, createTinyWav({ sampleRate: 24000, frames: 240 }));
  await writeFile(invalid, createTinyWav({ sampleRate: 24000, frames: 0 }));

  const metadata = await readWavMetadata(valid);
  assert.equal(metadata.sampleRate, 24000);
  assert.equal(metadata.frameCount, 240);
  assert.equal(metadata.durationSeconds, 0.01);

  await assert.rejects(() => readWavMetadata(invalid), /invalid wav/i);
});

test('builds manifest chunk entries with sha256 while preserving existing full entries', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'vn-manifest-build-'));
  const manifestPath = path.join(repoRoot, 'audio', 'manifest.json');
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    generatedAt: 'previous',
    entries: [{ id: 'northern-explicit-0', value: 0, audioStyle: 'northern-explicit', file: 'audio/northern-explicit/0.wav' }],
  }, null, 2));

  await writeChunk(repoRoot, 'audio/chunks/northern/under-1000/0.wav');
  await writeChunk(repoRoot, 'audio/chunks/northern/thousand-prefix/2.wav');
  await writeChunk(repoRoot, 'audio/chunks/northern/explicit-low-remainder/26.wav');
  await writeChunk(repoRoot, 'audio/chunks/northern/compact-low-digit/5.wav');

  const manifest = await buildAudioManifest({
    repoRoot,
    manifestPath,
    accent: 'northern',
    requireComplete: false,
    generatedAt: '2026-05-14T00:00:00.000Z',
    generator: 'test-builder',
    style: 'test style',
  });

  assert.equal(manifest.generatedAt, '2026-05-14T00:00:00.000Z');
  assert.equal(manifest.generator, 'test-builder');
  assert.equal(manifest.style, 'test style');
  assert.equal(manifest.entries.length, 1);
  assert.equal(manifest.chunks.length, 4);

  const chunk = manifest.chunks.find((entry) => entry.kind === 'explicit-low-remainder');
  assert.equal(chunk.id, 'northern-explicit-low-remainder-26');
  assert.equal(chunk.text, 'không trăm hai mươi sáu');
  assert.equal(chunk.file, 'audio/chunks/northern/explicit-low-remainder/26.wav');
  assert.equal(chunk.format, 'wav');
  assert.match(chunk.sha256, /^[a-f0-9]{64}$/);
  assert.equal(chunk.durationSeconds, 0.01);

  const written = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(written.chunks.length, 4);
});

test('requires the complete 1117-file Northern pack by default', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'vn-manifest-incomplete-'));
  await writeChunk(repoRoot, 'audio/chunks/northern/under-1000/0.wav');

  await assert.rejects(() => buildAudioManifest({ repoRoot, accent: 'northern' }), /missing 1116 expected chunk files/i);
  assert.equal(existsSync(path.join(repoRoot, 'audio', 'manifest.json')), false);
});
