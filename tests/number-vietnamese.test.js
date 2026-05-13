import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_VARIANT,
  digitToVietnamese,
  getVietnameseNumberForms,
  numberToVietnamese,
} from '../src/number-vietnamese.js';

test('exposes Northern-first default variant', () => {
  assert.equal(DEFAULT_VARIANT.zeroTensWord, 'lẻ');
  assert.equal(DEFAULT_VARIANT.thousandWord, 'nghìn');
  assert.equal(DEFAULT_VARIANT.compoundFourWord, 'bốn');
});

test('converts base digits and ten', () => {
  assert.equal(digitToVietnamese(0), 'không');
  assert.equal(digitToVietnamese(1), 'một');
  assert.equal(digitToVietnamese(5), 'năm');
  assert.equal(numberToVietnamese(10), 'mười');
});

test('converts teens and tens with Northern special unit forms', () => {
  assert.equal(numberToVietnamese(11), 'mười một');
  assert.equal(numberToVietnamese(15), 'mười lăm');
  assert.equal(numberToVietnamese(20), 'hai mươi');
  assert.equal(numberToVietnamese(21), 'hai mươi mốt');
  assert.equal(numberToVietnamese(24), 'hai mươi bốn');
  assert.equal(numberToVietnamese(25), 'hai mươi lăm');
  assert.equal(numberToVietnamese(99), 'chín mươi chín');
});

test('converts hundreds using Northern lẻ for missing tens', () => {
  assert.equal(numberToVietnamese(100), 'một trăm');
  assert.equal(numberToVietnamese(101), 'một trăm lẻ một');
  assert.equal(numberToVietnamese(105), 'một trăm lẻ năm');
  assert.equal(numberToVietnamese(115), 'một trăm mười lăm');
  assert.equal(numberToVietnamese(121), 'một trăm hai mươi mốt');
  assert.equal(numberToVietnamese(999), 'chín trăm chín mươi chín');
});

test('converts thousands in explicit textbook style by default', () => {
  assert.equal(numberToVietnamese(1000), 'một nghìn');
  assert.equal(numberToVietnamese(1001), 'một nghìn không trăm lẻ một');
  assert.equal(numberToVietnamese(1010), 'một nghìn không trăm mười');
  assert.equal(numberToVietnamese(1105), 'một nghìn một trăm lẻ năm');
  assert.equal(numberToVietnamese(2026), 'hai nghìn không trăm hai mươi sáu');
  assert.equal(numberToVietnamese(9999), 'chín nghìn chín trăm chín mươi chín');
});

test('converts thousands in compact everyday style when requested', () => {
  assert.equal(numberToVietnamese(2026, { thousandStyle: 'compact' }), 'hai nghìn hai mươi sáu');
  assert.equal(numberToVietnamese(2005, { thousandStyle: 'compact' }), 'hai nghìn lẻ năm');
  assert.equal(numberToVietnamese(2105, { thousandStyle: 'compact' }), 'hai nghìn một trăm lẻ năm');
});

test('returns Northern primary form with Southern supplemental aliases', () => {
  const forms = getVietnameseNumberForms(2026);

  assert.equal(forms.primary, 'hai nghìn không trăm hai mươi sáu');
  assert.ok(forms.aliases.includes('hai ngàn không trăm hai mươi sáu'));
  assert.ok(forms.compact.includes('hai nghìn hai mươi sáu'));
  assert.ok(forms.compactAliases.includes('hai ngàn hai mươi sáu'));
});

test('rejects unsupported number inputs clearly', () => {
  assert.throws(() => numberToVietnamese(-1), /between 0 and 9999/);
  assert.throws(() => numberToVietnamese(10000), /between 0 and 9999/);
  assert.throws(() => numberToVietnamese(1.5), /integer/);
  assert.throws(() => digitToVietnamese(10), /digit/);
});
