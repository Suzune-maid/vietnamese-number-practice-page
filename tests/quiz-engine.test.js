import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkAnswer,
  createMultipleChoiceOptions,
  createQuestion,
  formatChoiceOption,
  isScoredMode,
  RANGE_PRESETS,
} from '../src/quiz-engine.js';

function fixedRng(value) {
  return () => value;
}

test('creates deterministic typing question within selected range', () => {
  const question = createQuestion({ mode: 'typing', rangeId: '0-99' }, fixedRng(0.25));

  assert.equal(question.mode, 'typing');
  assert.equal(question.value, 25);
  assert.equal(question.prompt, '25');
  assert.equal(question.answer.primary, 'hai mươi lăm');
});

test('creates compact thousand listening question when requested', () => {
  const question = createQuestion(
    { mode: 'listening-choice', rangeId: '1000-9999', thousandStyle: 'compact' },
    fixedRng(0.114),
  );

  assert.equal(question.value, 2026);
  assert.equal(question.answer.primary, 'hai nghìn hai mươi sáu');
  assert.equal(question.audioStyle, 'northern-compact');
});

test('multiple choice options include correct value exactly once', () => {
  const options = createMultipleChoiceOptions(25, RANGE_PRESETS['0-99'], fixedRng(0.2));

  assert.equal(options.filter((value) => value === 25).length, 1);
  assert.equal(options.length, 4);
  assert.equal(new Set(options).size, 4);
});

test('multiple choice options do not keep the correct value fixed at first position', () => {
  const values = [0.2, 0.3, 0.4, 0.9, 0.1, 0.8];
  const rng = () => values.shift() ?? 0.5;
  const options = createMultipleChoiceOptions(25, RANGE_PRESETS['0-99'], rng);

  assert.notEqual(options[0], 25);
  assert.equal(options.filter((value) => value === 25).length, 1);
});

test('checks typing answers with Southern alias and no diacritics', () => {
  const question = createQuestion(
    { mode: 'typing', rangeId: '1000-9999', thousandStyle: 'explicit' },
    fixedRng(0.114),
  );

  assert.equal(checkAnswer(question, 'hai ngan khong tram hai muoi sau').correct, true);
});

test('checks multiple choice answer by numeric value', () => {
  const question = createQuestion({ mode: 'choice', rangeId: '0-10' }, fixedRng(0.5));

  assert.equal(checkAnswer(question, String(question.value)).correct, true);
  assert.equal(checkAnswer(question, String(question.value + 1)).correct, false);
  assert.equal(checkAnswer(question, `${question.value}abc`).correct, false);
});

test('formats multiple choice options as Vietnamese text for display', () => {
  assert.equal(formatChoiceOption(25, 'explicit'), 'hai mươi lăm');
  assert.equal(formatChoiceOption(2026, 'compact'), 'hai nghìn hai mươi sáu');
});

test('scores answer-based practice modes but not flashcards', () => {
  assert.equal(isScoredMode('flashcard'), false);
  assert.equal(isScoredMode('choice'), true);
  assert.equal(isScoredMode('typing'), true);
  assert.equal(isScoredMode('listening-choice'), true);
});
