export function normalizeVietnameseAnswer(text, options = {}) {
  const { stripDiacritics = false } = options;
  let normalized = String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (stripDiacritics) {
    normalized = normalized
      .replaceAll('đ', 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .normalize('NFC');
  }

  return normalized;
}

export function isAnswerEquivalent(userInput, expected, aliases = [], options = {}) {
  const candidates = [expected, ...aliases];
  const strictUser = normalizeVietnameseAnswer(userInput);

  if (candidates.some((candidate) => normalizeVietnameseAnswer(candidate) === strictUser)) {
    return true;
  }

  const forgiving = options.stripDiacritics ?? true;
  if (!forgiving) return false;

  const looseUser = normalizeVietnameseAnswer(userInput, { stripDiacritics: true });
  return candidates.some(
    (candidate) => normalizeVietnameseAnswer(candidate, { stripDiacritics: true }) === looseUser,
  );
}
