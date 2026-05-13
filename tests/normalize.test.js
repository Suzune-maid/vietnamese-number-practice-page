import test from 'node:test';
import assert from 'node:assert/strict';

import { isAnswerEquivalent, normalizeVietnameseAnswer } from '../src/normalize.js';

test('normalizes whitespace and case', () => {
  assert.equal(normalizeVietnameseAnswer('  Hai   Mươi  Lăm '), 'hai mươi lăm');
});

test('optionally strips Vietnamese diacritics', () => {
  assert.equal(normalizeVietnameseAnswer('mười lăm', { stripDiacritics: true }), 'muoi lam');
  assert.equal(normalizeVietnameseAnswer('Đồng', { stripDiacritics: true }), 'dong');
});

test('checks equivalent answers with aliases and forgiving diacritic mode', () => {
  assert.equal(isAnswerEquivalent('hai ngan hai muoi sau', 'hai nghìn hai mươi sáu', ['hai ngàn hai mươi sáu']), true);
});

test('keeps unrelated answers different', () => {
  assert.equal(isAnswerEquivalent('hai mươi sáu', 'hai mươi lăm'), false);
});
