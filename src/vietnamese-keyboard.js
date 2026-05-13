export const VIETNAMESE_KEYBOARD_LAYOUT = Object.freeze([
  {
    id: 'letters',
    label: '越南語字母',
    keys: ['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư'].map((value) => ({ value, type: 'insert' })),
  },
  {
    id: 'tones',
    label: '聲調',
    keys: [
      { value: 'sắc', mark: 'sac', type: 'tone' },
      { value: 'huyền', mark: 'huyen', type: 'tone' },
      { value: 'hỏi', mark: 'hoi', type: 'tone' },
      { value: 'ngã', mark: 'nga', type: 'tone' },
      { value: 'nặng', mark: 'nang', type: 'tone' },
      { value: 'clear tone', mark: 'clear', type: 'tone' },
    ],
  },
]);

const TONE_TABLE = Object.freeze({
  a: { none: 'a', sac: 'á', huyen: 'à', hoi: 'ả', nga: 'ã', nang: 'ạ' },
  ă: { none: 'ă', sac: 'ắ', huyen: 'ằ', hoi: 'ẳ', nga: 'ẵ', nang: 'ặ' },
  â: { none: 'â', sac: 'ấ', huyen: 'ầ', hoi: 'ẩ', nga: 'ẫ', nang: 'ậ' },
  e: { none: 'e', sac: 'é', huyen: 'è', hoi: 'ẻ', nga: 'ẽ', nang: 'ẹ' },
  ê: { none: 'ê', sac: 'ế', huyen: 'ề', hoi: 'ể', nga: 'ễ', nang: 'ệ' },
  i: { none: 'i', sac: 'í', huyen: 'ì', hoi: 'ỉ', nga: 'ĩ', nang: 'ị' },
  o: { none: 'o', sac: 'ó', huyen: 'ò', hoi: 'ỏ', nga: 'õ', nang: 'ọ' },
  ô: { none: 'ô', sac: 'ố', huyen: 'ồ', hoi: 'ổ', nga: 'ỗ', nang: 'ộ' },
  ơ: { none: 'ơ', sac: 'ớ', huyen: 'ờ', hoi: 'ở', nga: 'ỡ', nang: 'ợ' },
  u: { none: 'u', sac: 'ú', huyen: 'ù', hoi: 'ủ', nga: 'ũ', nang: 'ụ' },
  ư: { none: 'ư', sac: 'ứ', huyen: 'ừ', hoi: 'ử', nga: 'ữ', nang: 'ự' },
  y: { none: 'y', sac: 'ý', huyen: 'ỳ', hoi: 'ỷ', nga: 'ỹ', nang: 'ỵ' },
});

const TONE_ALIASES = Object.freeze({
  sắc: 'sac',
  huyền: 'huyen',
  hỏi: 'hoi',
  ngã: 'nga',
  nặng: 'nang',
});

const CHAR_TO_BASE = new Map();
for (const [base, forms] of Object.entries(TONE_TABLE)) {
  for (const char of Object.values(forms)) {
    CHAR_TO_BASE.set(char, base);
    CHAR_TO_BASE.set(char.toUpperCase(), base.toUpperCase());
  }
}

function normalizeToneKey(toneKey) {
  return TONE_ALIASES[toneKey] ?? toneKey;
}

function baseForVietnameseVowel(char) {
  const lower = char.toLowerCase();
  return CHAR_TO_BASE.get(lower) ?? null;
}

function withTone(char, toneKey) {
  const base = baseForVietnameseVowel(char);
  if (!base) return char;

  const tone = normalizeToneKey(toneKey);
  const replacement = TONE_TABLE[base]?.[tone];
  if (!replacement) return char;

  return char === char.toUpperCase() ? replacement.toUpperCase() : replacement;
}

function findToneTargetIndex(text) {
  const chars = [...text];
  const lastSpaceIndex = Math.max(text.lastIndexOf(' '), text.lastIndexOf('\t'), text.lastIndexOf('\n'));
  const start = lastSpaceIndex + 1;
  const candidates = [];

  let codeUnitIndex = 0;
  for (const char of chars) {
    const currentIndex = codeUnitIndex;
    codeUnitIndex += char.length;
    if (currentIndex < start) continue;
    const base = baseForVietnameseVowel(char);
    if (base) {
      candidates.push({ index: currentIndex, base });
    }
  }

  if (candidates.length === 0) return -1;

  const preferred = [...candidates].reverse().find(({ base }) => base !== 'i' && base !== 'y');
  return (preferred ?? candidates.at(-1)).index;
}

export function insertVietnameseCharacter(currentValue, selectionStart, selectionEnd, key) {
  const value = String(currentValue ?? '');
  const start = Math.max(0, selectionStart ?? value.length);
  const end = Math.max(start, selectionEnd ?? start);
  const insert = String(key ?? '');
  const nextValue = `${value.slice(0, start)}${insert}${value.slice(end)}`;
  const nextCursor = start + insert.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

export function applyVietnameseTone(baseText, toneKey) {
  const text = String(baseText ?? '');
  const tone = normalizeToneKey(toneKey);

  if (tone === 'clear') {
    return clearVietnameseTone(text);
  }

  const targetIndex = findToneTargetIndex(text);
  if (targetIndex < 0) return text;

  const char = text.slice(targetIndex, targetIndex + 1);
  return `${text.slice(0, targetIndex)}${withTone(char, tone)}${text.slice(targetIndex + 1)}`;
}

export function clearVietnameseTone(text) {
  return String(text ?? '').replace(/./gu, (char) => {
    const base = baseForVietnameseVowel(char);
    if (!base) return char;
    return char === char.toUpperCase() ? base.toUpperCase() : base;
  });
}
