import { numberToVietnamese } from './number-vietnamese.js';

export const geminiVietnameseStyle = 'Natural Northern Vietnamese pronunciation. Clear, friendly, medium-slow pace for a beginner language learner. Read the number exactly once.';

function assertSupportedRange(min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > 9999) {
    throw new RangeError('min and max must be integers from 0 to 9999');
  }

  if (min > max) {
    throw new RangeError('min must be less than or equal to max');
  }
}

function thousandStyleForAudioStyle(audioStyle) {
  if (audioStyle === 'northern-explicit') return 'explicit';
  if (audioStyle === 'northern-compact') return 'compact';
  throw new RangeError(`unsupported audioStyle: ${audioStyle}`);
}

export function createTtsBatchRecords({ min = 0, max = 9999, audioStyle = 'northern-explicit' } = {}) {
  assertSupportedRange(min, max);
  const thousandStyle = thousandStyleForAudioStyle(audioStyle);
  const records = [];

  for (let value = min; value <= max; value += 1) {
    records.push({
      id: String(value),
      text: numberToVietnamese(value, { thousandStyle }),
    });
  }

  return records;
}
