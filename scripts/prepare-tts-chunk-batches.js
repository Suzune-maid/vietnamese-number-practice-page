#!/usr/bin/env node
import { writeTtsChunkBatchFiles } from '../src/tts-chunk-batch.js';

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1] ?? fallback;
  return fallback;
}

const accent = argValue('accent', 'northern');
const outputDir = argValue('output-dir', 'tmp/tts-batches/chunks/northern');

try {
  const summary = await writeTtsChunkBatchFiles({ accent, outputDir });
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
