import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { createAudioChunkEntry, expectedAudioChunkPath } from './audio-manifest.js';
import { CHUNK_KINDS, createTtsChunkBatchRecords } from './tts-chunk-batch.js';

export const DEFAULT_TTS_STYLE = 'Natural Northern Vietnamese pronunciation. Clear, friendly, medium-slow pace for a beginner language learner. Read the number exactly once.';

function findChunk(buffer, label) {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === label) return { offset: offset + 8, size };
    offset += 8 + size + (size % 2);
  }
  return null;
}

export async function readWavMetadata(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.length <= 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`invalid WAV: ${filePath}`);
  }

  const fmt = findChunk(buffer, 'fmt ');
  const data = findChunk(buffer, 'data');
  if (!fmt || !data || fmt.size < 16) throw new Error(`invalid WAV chunks: ${filePath}`);

  const audioFormat = buffer.readUInt16LE(fmt.offset);
  const channels = buffer.readUInt16LE(fmt.offset + 2);
  const sampleRate = buffer.readUInt32LE(fmt.offset + 4);
  const bitsPerSample = buffer.readUInt16LE(fmt.offset + 14);
  const bytesPerFrame = channels * (bitsPerSample / 8);
  const frameCount = bytesPerFrame > 0 ? Math.floor(data.size / bytesPerFrame) : 0;
  const durationSeconds = sampleRate > 0 ? Number((frameCount / sampleRate).toFixed(6)) : 0;

  if (audioFormat !== 1 || channels < 1 || sampleRate <= 0 || bitsPerSample <= 0 || frameCount <= 0 || durationSeconds <= 0) {
    throw new Error(`invalid WAV metadata: ${filePath}`);
  }

  return {
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    dataBytes: data.size,
    frameCount,
    durationSeconds,
  };
}

async function sha256File(filePath) {
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

function expectedChunkDescriptors(accent) {
  return CHUNK_KINDS.flatMap((kind) => (
    createTtsChunkBatchRecords({ accent, kind }).map((record) => ({
      accent,
      kind,
      value: Number(record.id),
      text: record.text,
    }))
  ));
}

async function readExistingManifest(manifestPath) {
  if (!existsSync(manifestPath)) return {};
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

export async function buildAudioManifest({
  repoRoot = process.cwd(),
  manifestPath = path.join(repoRoot, 'audio', 'manifest.json'),
  accent = 'northern',
  requireComplete = true,
  generatedAt = new Date().toISOString(),
  generator = 'scripts/build-audio-manifest.js',
  style = DEFAULT_TTS_STYLE,
} = {}) {
  const existing = await readExistingManifest(manifestPath);
  const descriptors = expectedChunkDescriptors(accent);
  const missing = [];
  const chunks = [];

  for (const descriptor of descriptors) {
    const relativePath = expectedAudioChunkPath(descriptor, 'wav');
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      missing.push(relativePath);
      continue;
    }

    const metadata = await readWavMetadata(absolutePath);
    const fileStat = await stat(absolutePath);
    chunks.push(createAudioChunkEntry({
      ...descriptor,
      format: 'wav',
      durationSeconds: metadata.durationSeconds,
      sha256: await sha256File(absolutePath),
      sizeBytes: fileStat.size,
    }));
    chunks[chunks.length - 1].sizeBytes = fileStat.size;
  }

  if (requireComplete && missing.length > 0) {
    throw new Error(`missing ${missing.length} expected chunk files for ${accent}; first missing: ${missing.slice(0, 5).join(', ')}`);
  }

  const manifest = {
    ...existing,
    schemaVersion: existing.schemaVersion ?? 1,
    generatedAt,
    generator,
    style,
    entries: Array.isArray(existing.entries) ? existing.entries : [],
    chunks,
  };

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}
