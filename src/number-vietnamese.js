export const DEFAULT_VARIANT = Object.freeze({
  zeroTensWord: 'lẻ',
  thousandWord: 'nghìn',
  southernThousandWord: 'ngàn',
  compoundFourWord: 'bốn',
});

const DIGITS = Object.freeze([
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
]);

function assertIntegerInRange(value) {
  if (!Number.isInteger(value)) {
    throw new TypeError('Vietnamese number conversion requires an integer.');
  }

  if (value < 0 || value > 9999) {
    throw new RangeError('Vietnamese number conversion supports values between 0 and 9999.');
  }
}

export function digitToVietnamese(digit) {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new RangeError('Expected a single digit between 0 and 9.');
  }

  return DIGITS[digit];
}

function unitAfterTens(unit, variant) {
  if (unit === 1) return 'mốt';
  if (unit === 4) return variant.compoundFourWord;
  if (unit === 5) return 'lăm';
  return digitToVietnamese(unit);
}

function convertUnderOneHundred(value, variant = DEFAULT_VARIANT) {
  if (value < 10) return digitToVietnamese(value);

  const tens = Math.floor(value / 10);
  const unit = value % 10;

  if (tens === 1) {
    if (unit === 0) return 'mười';
    if (unit === 5) return 'mười lăm';
    return `mười ${digitToVietnamese(unit)}`;
  }

  const words = [`${digitToVietnamese(tens)} mươi`];
  if (unit !== 0) {
    words.push(unitAfterTens(unit, variant));
  }
  return words.join(' ');
}

function convertUnderOneThousand(value, variant = DEFAULT_VARIANT) {
  if (value < 100) return convertUnderOneHundred(value, variant);

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const words = [`${digitToVietnamese(hundreds)} trăm`];

  if (remainder === 0) {
    return words.join(' ');
  }

  if (remainder < 10) {
    words.push(variant.zeroTensWord, digitToVietnamese(remainder));
  } else {
    words.push(convertUnderOneHundred(remainder, variant));
  }

  return words.join(' ');
}

function convertExplicitThousands(value, variant) {
  const thousands = Math.floor(value / 1000);
  const remainder = value % 1000;
  const words = [`${digitToVietnamese(thousands)} ${variant.thousandWord}`];

  if (remainder === 0) {
    return words.join(' ');
  }

  if (remainder < 100) {
    words.push('không trăm');
    if (remainder < 10) {
      words.push(variant.zeroTensWord, digitToVietnamese(remainder));
    } else {
      words.push(convertUnderOneHundred(remainder, variant));
    }
  } else {
    words.push(convertUnderOneThousand(remainder, variant));
  }

  return words.join(' ');
}

function convertCompactThousands(value, variant) {
  const thousands = Math.floor(value / 1000);
  const remainder = value % 1000;
  const words = [`${digitToVietnamese(thousands)} ${variant.thousandWord}`];

  if (remainder === 0) {
    return words.join(' ');
  }

  if (remainder < 10) {
    words.push(variant.zeroTensWord, digitToVietnamese(remainder));
  } else if (remainder < 100) {
    words.push(convertUnderOneHundred(remainder, variant));
  } else {
    words.push(convertUnderOneThousand(remainder, variant));
  }

  return words.join(' ');
}

export function numberToVietnamese(value, options = {}) {
  assertIntegerInRange(value);

  const variant = { ...DEFAULT_VARIANT, ...options.variant };
  const thousandStyle = options.thousandStyle ?? 'explicit';

  if (value < 1000) {
    return convertUnderOneThousand(value, variant);
  }

  if (thousandStyle === 'explicit') {
    return convertExplicitThousands(value, variant);
  }

  if (thousandStyle === 'compact') {
    return convertCompactThousands(value, variant);
  }

  throw new RangeError(`Unsupported thousandStyle: ${thousandStyle}`);
}

function southernThousandAlias(text, variant = DEFAULT_VARIANT) {
  return text.replaceAll(variant.thousandWord, variant.southernThousandWord);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function getVietnameseNumberForms(value, options = {}) {
  const variant = { ...DEFAULT_VARIANT, ...options.variant };
  const primary = numberToVietnamese(value, { variant, thousandStyle: 'explicit' });
  const compactPrimary = numberToVietnamese(value, { variant, thousandStyle: 'compact' });

  return {
    value,
    primary,
    aliases: unique([southernThousandAlias(primary, variant)]).filter((alias) => alias !== primary),
    compact: unique([compactPrimary]).filter((form) => form !== primary),
    compactAliases: unique([southernThousandAlias(compactPrimary, variant)]).filter(
      (alias) => alias !== primary && alias !== compactPrimary,
    ),
  };
}
