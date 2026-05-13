import { getVietnameseNumberForms, numberToVietnamese } from './number-vietnamese.js';
import { isAnswerEquivalent } from './normalize.js';

export const RANGE_PRESETS = Object.freeze({
  '0-10': { id: '0-10', label: '0–10', min: 0, max: 10 },
  '11-20': { id: '11-20', label: '11–20', min: 11, max: 20 },
  '0-99': { id: '0-99', label: '0–99', min: 0, max: 99 },
  '100-999': { id: '100-999', label: '100–999', min: 100, max: 999 },
  '1000-9999': { id: '1000-9999', label: '1000–9999', min: 1000, max: 9999 },
});

function pickInteger(range, rng) {
  const span = range.max - range.min + 1;
  return range.min + Math.floor(rng() * span);
}

function createAnswer(value, thousandStyle) {
  const forms = getVietnameseNumberForms(value);

  if (thousandStyle === 'compact') {
    const primary = numberToVietnamese(value, { thousandStyle: 'compact' });
    return {
      primary,
      aliases: [...forms.compactAliases, forms.primary, ...forms.aliases].filter(
        (form) => form && form !== primary,
      ),
      forms,
    };
  }

  return {
    primary: forms.primary,
    aliases: [...forms.aliases, ...forms.compact, ...forms.compactAliases].filter(
      (form) => form && form !== forms.primary,
    ),
    forms,
  };
}

function shuffle(values, rng) {
  const items = [...values];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

export function createMultipleChoiceOptions(correctValue, range, rng = Math.random) {
  const options = new Set([correctValue]);
  const maxAttempts = 100;
  let attempts = 0;

  while (options.size < 4 && attempts < maxAttempts) {
    options.add(pickInteger(range, rng));
    attempts += 1;
  }

  let fallback = range.min;
  while (options.size < 4 && fallback <= range.max) {
    options.add(fallback);
    fallback += 1;
  }

  return shuffle([...options].slice(0, 4), rng);
}

export function createQuestion(config = {}, rng = Math.random) {
  const mode = config.mode ?? 'flashcard';
  const range = RANGE_PRESETS[config.rangeId ?? '0-10'] ?? RANGE_PRESETS['0-10'];
  const thousandStyle = config.thousandStyle ?? 'explicit';
  const value = pickInteger(range, rng);
  const answer = createAnswer(value, thousandStyle);
  const options = mode === 'choice' || mode === 'listening-choice'
    ? createMultipleChoiceOptions(value, range, rng)
    : [];

  return {
    id: `${mode}-${range.id}-${value}-${thousandStyle}`,
    mode,
    range,
    value,
    prompt: String(value),
    answer,
    options,
    thousandStyle,
    audioStyle: thousandStyle === 'compact' ? 'northern-compact' : 'northern-explicit',
  };
}

export function checkAnswer(question, answer) {
  if (question.mode === 'choice' || question.mode === 'listening-choice') {
    const rawAnswer = String(answer).trim();
    const numericAnswer = /^\d+$/.test(rawAnswer) ? Number.parseInt(rawAnswer, 10) : Number.NaN;
    const correct = numericAnswer === question.value;
    return {
      correct,
      expected: String(question.value),
      actual: String(answer),
    };
  }

  const correct = isAnswerEquivalent(answer, question.answer.primary, question.answer.aliases);
  return {
    correct,
    expected: question.answer.primary,
    actual: String(answer ?? ''),
    aliases: question.answer.aliases,
  };
}
