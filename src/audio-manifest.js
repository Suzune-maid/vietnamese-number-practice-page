import { digitToVietnamese, numberToVietnamese } from './number-vietnamese.js';

const DIALECT_LABELS = Object.freeze({
  northern: 'Northern Vietnamese',
  southern: 'Southern Vietnamese',
});

const ACCENT_VARIANTS = Object.freeze({
  northern: Object.freeze({ thousandWord: 'nghìn', southernThousandWord: 'ngàn' }),
  southern: Object.freeze({ thousandWord: 'ngàn', southernThousandWord: 'ngàn' }),
});

export function createAudioId(value, audioStyle) {
  return `${audioStyle}-${value}`;
}

export function expectedAudioPath(value, audioStyle, format = 'mp3') {
  return `audio/${audioStyle}/${value}.${format}`;
}

function parseAudioStyle(audioStyle = 'northern-explicit') {
  const [accent = 'northern', thousandStyle = 'explicit'] = String(audioStyle).split('-');
  if (!['northern', 'southern'].includes(accent)) return null;
  if (!['explicit', 'compact'].includes(thousandStyle)) return null;
  return { accent, thousandStyle };
}

function variantForAccent(accent) {
  return ACCENT_VARIANTS[accent] ?? ACCENT_VARIANTS.northern;
}

function dialectForAccent(accent) {
  return DIALECT_LABELS[accent] ?? DIALECT_LABELS.northern;
}

function chunkId(accent, kind, value) {
  return `${accent}-${kind}-${value}`;
}

function createChunkDescriptor({ accent, kind, value, text }) {
  return {
    id: chunkId(accent, kind, value),
    accent,
    kind,
    value,
    dialect: dialectForAccent(accent),
    text,
  };
}

export function expectedAudioChunkPath({ accent, kind, value }, format = 'mp3') {
  return `audio/chunks/${accent}/${kind}/${value}.${format}`;
}

export function createAudioChunkEntry({
  id,
  accent,
  kind,
  value,
  dialect = dialectForAccent(accent),
  text,
  format = 'mp3',
  durationSeconds = null,
  sha256 = null,
}) {
  const entry = {
    id: id ?? chunkId(accent, kind, value),
    accent,
    kind,
    value,
    dialect,
    text,
    file: expectedAudioChunkPath({ accent, kind, value }, format),
    format,
  };

  if (durationSeconds !== null) entry.durationSeconds = durationSeconds;
  if (sha256 !== null) entry.sha256 = sha256;

  return entry;
}

export function createAudioEntry({
  value,
  audioStyle,
  text,
  format = 'mp3',
  durationSeconds = null,
  sha256 = null,
}) {
  const style = parseAudioStyle(audioStyle) ?? { accent: 'northern' };
  const entry = {
    id: createAudioId(value, audioStyle),
    value,
    audioStyle,
    dialect: dialectForAccent(style.accent),
    text,
    file: expectedAudioPath(value, audioStyle, format),
    format,
  };

  if (durationSeconds !== null) entry.durationSeconds = durationSeconds;
  if (sha256 !== null) entry.sha256 = sha256;

  return entry;
}

function lowRemainderText(remainder, accent) {
  const variant = variantForAccent(accent);
  if (remainder < 10) {
    return `không trăm ${variant.zeroTensWord ?? 'lẻ'} ${digitToVietnamese(remainder)}`;
  }
  return `không trăm ${numberToVietnamese(remainder, { variant })}`;
}

export function createChunkSequenceForQuestion(question) {
  if (!question || !Number.isInteger(question.value)) return [];

  const style = parseAudioStyle(question.audioStyle);
  if (!style) return [];

  const { accent, thousandStyle } = style;
  const variant = variantForAccent(accent);
  const { value } = question;

  if (value < 1000) {
    return [createChunkDescriptor({
      accent,
      kind: 'under-1000',
      value,
      text: numberToVietnamese(value, { variant }),
    })];
  }

  const thousands = Math.floor(value / 1000);
  const remainder = value % 1000;
  const sequence = [createChunkDescriptor({
    accent,
    kind: 'thousand-prefix',
    value: thousands,
    text: `${digitToVietnamese(thousands)} ${variant.thousandWord}`,
  })];

  if (remainder === 0) return sequence;

  if (thousandStyle === 'explicit' && remainder < 100) {
    sequence.push(createChunkDescriptor({
      accent,
      kind: 'explicit-low-remainder',
      value: remainder,
      text: lowRemainderText(remainder, accent),
    }));
    return sequence;
  }

  if (thousandStyle === 'compact' && remainder < 10) {
    sequence.push(createChunkDescriptor({
      accent,
      kind: 'compact-low-digit',
      value: remainder,
      text: `${variant.zeroTensWord ?? 'lẻ'} ${digitToVietnamese(remainder)}`,
    }));
    return sequence;
  }

  sequence.push(createChunkDescriptor({
    accent,
    kind: 'under-1000',
    value: remainder,
    text: numberToVietnamese(remainder, { variant }),
  }));
  return sequence;
}

function isSafeAudioFilePath(file) {
  if (typeof file !== 'string') return false;
  if (!file.startsWith('audio/')) return false;
  if (file.includes('..') || file.includes('\\') || file.includes('//')) return false;
  return (
    /^audio\/[a-z0-9-]+\/[0-9]+\.(mp3|wav|ogg)$/.test(file)
    || /^audio\/chunks\/[a-z]+\/[a-z0-9-]+\/[0-9]+\.(mp3|wav|ogg)$/.test(file)
  );
}

function findFullAudioEntry(manifest, question) {
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  return entries.find((entry) => (
    entry.value === question.value
    && entry.audioStyle === question.audioStyle
    && isSafeAudioFilePath(entry.file)
  )) ?? null;
}

function isSupportedAudioFormat(format) {
  return ['mp3', 'wav', 'ogg'].includes(format);
}

function findChunkAudioEntry(manifest, chunk) {
  return (manifest.chunks ?? []).find((entry) => (
    entry.id === chunk.id
    && entry.accent === chunk.accent
    && entry.kind === chunk.kind
    && entry.value === chunk.value
    && isSupportedAudioFormat(entry.format)
    && entry.file === expectedAudioChunkPath(chunk, entry.format)
    && isSafeAudioFilePath(entry.file)
  )) ?? null;
}

function findChunkSequenceAudioEntry(manifest, question) {
  if (!Array.isArray(manifest.chunks)) return null;

  const expectedChunks = createChunkSequenceForQuestion(question);
  if (expectedChunks.length === 0) return null;

  const chunks = expectedChunks.map((chunk) => findChunkAudioEntry(manifest, chunk));
  if (chunks.some((chunk) => !chunk)) return null;

  const style = parseAudioStyle(question.audioStyle) ?? { accent: 'northern' };
  return {
    id: `${question.audioStyle}-${question.value}-sequence`,
    value: question.value,
    audioStyle: question.audioStyle,
    dialect: dialectForAccent(style.accent),
    text: question.answer?.primary ?? expectedChunks.map((chunk) => chunk.text).join(' '),
    files: chunks.map((chunk) => chunk.file),
    sequence: chunks,
    isSequence: true,
  };
}

export function findAudioEntryForQuestion(manifest, question) {
  if (!manifest || !question) return null;

  const fullEntry = findFullAudioEntry(manifest, question);
  if (fullEntry) return fullEntry;

  return findChunkSequenceAudioEntry(manifest, question);
}

export function summarizeManifestAvailability(manifest) {
  if (!manifest || (!Array.isArray(manifest.entries) && !Array.isArray(manifest.chunks))) {
    return {
      loaded: false,
      total: 0,
      message: 'Gemini TTS 音檔：待產生',
    };
  }

  const fullTotal = manifest.entries?.length ?? 0;
  const chunkTotal = manifest.chunks?.length ?? 0;
  const total = fullTotal + chunkTotal;
  const chunkLabel = chunkTotal > 0 ? `（含 ${chunkTotal} 個片段）` : '';
  return {
    loaded: true,
    total,
    message: `Gemini TTS 音檔：${total} 筆可用${chunkLabel}`,
  };
}
