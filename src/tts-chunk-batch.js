import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { digitToVietnamese, numberToVietnamese } from './number-vietnamese.js';

export const CHUNK_KINDS = Object.freeze([
  'under-1000',
  'thousand-prefix',
  'explicit-low-remainder',
  'compact-low-digit',
]);

const NORTHERN_VARIANT = Object.freeze({
  zeroTensWord: 'lẻ',
  thousandWord: 'nghìn',
  southernThousandWord: 'ngàn',
});

function assertNorthernAccent(accent) {
  if (accent !== 'northern') {
    throw new RangeError(`unsupported accent for chunk batch generation: ${accent}`);
  }
}

function assertSupportedKind(kind) {
  if (!CHUNK_KINDS.includes(kind)) {
    throw new RangeError(`unsupported chunk kind: ${kind}`);
  }
}

function explicitLowRemainderText(value) {
  if (value < 10) return `không trăm ${NORTHERN_VARIANT.zeroTensWord} ${digitToVietnamese(value)}`;
  return `không trăm ${numberToVietnamese(value, { variant: NORTHERN_VARIANT })}`;
}

export function createTtsChunkBatchRecords({ accent = 'northern', kind } = {}) {
  assertNorthernAccent(accent);
  assertSupportedKind(kind);

  if (kind === 'under-1000') {
    return Array.from({ length: 1000 }, (_, value) => ({
      id: String(value),
      text: numberToVietnamese(value, { variant: NORTHERN_VARIANT }),
    }));
  }

  if (kind === 'thousand-prefix') {
    return Array.from({ length: 9 }, (_, index) => {
      const value = index + 1;
      return {
        id: String(value),
        text: `${digitToVietnamese(value)} ${NORTHERN_VARIANT.thousandWord}`,
      };
    });
  }

  if (kind === 'explicit-low-remainder') {
    return Array.from({ length: 99 }, (_, index) => {
      const value = index + 1;
      return {
        id: String(value),
        text: explicitLowRemainderText(value),
      };
    });
  }

  return Array.from({ length: 9 }, (_, index) => {
    const value = index + 1;
    return {
      id: String(value),
      text: `${NORTHERN_VARIANT.zeroTensWord} ${digitToVietnamese(value)}`,
    };
  });
}

export function createAllTtsChunkBatchRecords({ accent = 'northern' } = {}) {
  assertNorthernAccent(accent);
  return Object.fromEntries(
    CHUNK_KINDS.map((kind) => [kind, createTtsChunkBatchRecords({ accent, kind })]),
  );
}

function toJsonl(records) {
  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
}

export async function writeTtsChunkBatchFiles({ accent = 'northern', outputDir } = {}) {
  assertNorthernAccent(accent);
  if (!outputDir) throw new TypeError('outputDir is required');

  await mkdir(outputDir, { recursive: true });

  const files = [];
  let totalRecords = 0;
  for (const kind of CHUNK_KINDS) {
    const records = createTtsChunkBatchRecords({ accent, kind });
    const filePath = path.join(outputDir, `${kind}.jsonl`);
    await writeFile(filePath, toJsonl(records), 'utf8');
    files.push({ kind, path: filePath, recordCount: records.length });
    totalRecords += records.length;
  }

  return { accent, outputDir, totalRecords, files };
}
