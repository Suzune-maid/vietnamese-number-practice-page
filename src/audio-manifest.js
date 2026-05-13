export function createAudioId(value, audioStyle) {
  return `${audioStyle}-${value}`;
}

export function expectedAudioPath(value, audioStyle, format = 'mp3') {
  return `audio/${audioStyle}/${value}.${format}`;
}

export function createAudioEntry({
  value,
  audioStyle,
  text,
  format = 'mp3',
  durationSeconds = null,
  sha256 = null,
}) {
  const entry = {
    id: createAudioId(value, audioStyle),
    value,
    audioStyle,
    dialect: 'Northern Vietnamese',
    text,
    file: expectedAudioPath(value, audioStyle, format),
    format,
  };

  if (durationSeconds !== null) entry.durationSeconds = durationSeconds;
  if (sha256 !== null) entry.sha256 = sha256;

  return entry;
}

function isSafeAudioFilePath(file) {
  if (typeof file !== 'string') return false;
  if (!file.startsWith('audio/')) return false;
  if (file.includes('..') || file.includes('\\') || file.includes('//')) return false;
  return /^audio\/[a-z0-9-]+\/[0-9]+\.(mp3|wav|ogg)$/.test(file);
}

export function findAudioEntryForQuestion(manifest, question) {
  if (!manifest || !Array.isArray(manifest.entries) || !question) return null;

  return manifest.entries.find((entry) => (
    entry.value === question.value
    && entry.audioStyle === question.audioStyle
    && isSafeAudioFilePath(entry.file)
  )) ?? null;
}

export function summarizeManifestAvailability(manifest) {
  if (!manifest || !Array.isArray(manifest.entries)) {
    return {
      loaded: false,
      total: 0,
      message: 'Gemini TTS 音檔：待產生',
    };
  }

  const total = manifest.entries.length;
  return {
    loaded: true,
    total,
    message: `Gemini TTS 音檔：${total} 筆可用`,
  };
}
