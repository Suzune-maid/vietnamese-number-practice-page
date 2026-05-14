#!/usr/bin/env node
import { buildAudioManifest, DEFAULT_TTS_STYLE } from '../src/audio-manifest-builder.js';

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1] ?? fallback;
  return fallback;
}

const accent = argValue('accent', 'northern');
const manifestPath = argValue('manifest', null);
const requireComplete = !process.argv.includes('--allow-incomplete');
const generatedAt = argValue('generated-at', new Date().toISOString());
const style = argValue('style', DEFAULT_TTS_STYLE);

try {
  const manifest = await buildAudioManifest({
    repoRoot: process.cwd(),
    manifestPath: manifestPath ?? undefined,
    accent,
    requireComplete,
    generatedAt,
    style,
  });
  console.log(JSON.stringify({
    entries: manifest.entries.length,
    chunks: manifest.chunks.length,
    generatedAt: manifest.generatedAt,
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
