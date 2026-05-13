import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VIETNAMESE_KEYBOARD_LAYOUT,
  applyVietnameseTone,
  clearVietnameseTone,
  insertVietnameseCharacter,
} from '../src/vietnamese-keyboard.js';

test('keyboard layout exposes Vietnamese-specific letters and tone keys', () => {
  const keys = VIETNAMESE_KEYBOARD_LAYOUT.flatMap((group) => group.keys.map((key) => key.value));

  for (const key of ['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng']) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
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
