import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VIETNAMESE_ALPHABET,
  VIETNAMESE_KEYBOARD_LAYOUT,
  applyVietnameseTone,
  clearVietnameseTone,
  handleVietnameseKeyboardAction,
  insertVietnameseCharacter,
} from '../src/vietnamese-keyboard.js';

test('keyboard layout exposes Vietnamese-specific letters and tone keys', () => {
  const keys = VIETNAMESE_KEYBOARD_LAYOUT.flatMap((group) => group.keys.map((key) => key.value));

  for (const key of ['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng']) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
});

test('keyboard layout exposes the full Vietnamese alphabet, not only special letters', () => {
  const keys = VIETNAMESE_KEYBOARD_LAYOUT.flatMap((group) => group.keys.map((key) => key.value));

  assert.deepEqual(VIETNAMESE_ALPHABET, [
    'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm',
    'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
  ]);
  for (const key of VIETNAMESE_ALPHABET) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
  assert.ok(keys.includes('space'), 'missing space key');
  assert.ok(keys.includes('xoá'), 'missing backspace key');
});

test('inserts Vietnamese character at cursor position', () => {
  assert.deepEqual(insertVietnameseCharacter('mi', 1, 1, 'ườ'), {
    value: 'mười',
    selectionStart: 3,
    selectionEnd: 3,
  });
});

test('replaces selected text with Vietnamese character', () => {
  assert.deepEqual(insertVietnameseCharacter('moui', 1, 3, 'ươ'), {
    value: 'mươi',
    selectionStart: 3,
    selectionEnd: 3,
  });
});

test('applies tone to common number-word vowel clusters', () => {
  assert.equal(applyVietnameseTone('mươi', 'huyền'), 'mười');
  assert.equal(applyVietnameseTone('môt', 'nặng'), 'một');
  assert.equal(applyVietnameseTone('bay', 'sắc'), 'báy');
});

test('clears tone while preserving Vietnamese base letters', () => {
  assert.equal(clearVietnameseTone('mười'), 'mươi');
  assert.equal(clearVietnameseTone('một'), 'môt');
});

test('handles keyboard actions for letters, space, backspace, and tones', () => {
  assert.deepEqual(handleVietnameseKeyboardAction('hai', 3, 3, { value: 'space', insert: ' ', type: 'insert' }), {
    value: 'hai ',
    selectionStart: 4,
    selectionEnd: 4,
  });
  assert.deepEqual(handleVietnameseKeyboardAction('hai ', 4, 4, { value: 'm', type: 'insert' }), {
    value: 'hai m',
    selectionStart: 5,
    selectionEnd: 5,
  });
  assert.deepEqual(handleVietnameseKeyboardAction('hai m', 5, 5, { value: 'xoá', type: 'backspace' }), {
    value: 'hai ',
    selectionStart: 4,
    selectionEnd: 4,
  });
  assert.deepEqual(handleVietnameseKeyboardAction('môt', 3, 3, { value: 'nặng', mark: 'nang', type: 'tone' }), {
    value: 'một',
    selectionStart: 3,
    selectionEnd: 3,
  });
});
