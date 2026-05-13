import { findAudioEntryForQuestion, summarizeManifestAvailability } from './audio-manifest.js';
import { playAudioFiles } from './audio-player.js';
import { checkAnswer, createQuestion } from './quiz-engine.js';
import {
  VIETNAMESE_KEYBOARD_LAYOUT,
  applyVietnameseTone,
  clearVietnameseTone,
  insertVietnameseCharacter,
} from './vietnamese-keyboard.js';

const state = {
  question: null,
  streak: 0,
  correct: 0,
  total: 0,
  audioManifest: null,
  currentAudioEntry: null,
  audioController: null,
  audioPlaybackId: 0,
};

const elements = {
  mode: document.querySelector('#mode-select'),
  range: document.querySelector('#range-select'),
  thousandStyle: document.querySelector('#thousand-style-select'),
  promptLabel: document.querySelector('#prompt-label'),
  promptValue: document.querySelector('#prompt-value'),
  vietnameseHint: document.querySelector('#vietnamese-hint'),
  dialectNote: document.querySelector('#dialect-note'),
  playAudio: document.querySelector('#play-audio-button'),
  audioStatus: document.querySelector('#audio-status'),
  options: document.querySelector('#choice-options'),
  typingForm: document.querySelector('#typing-form'),
  input: document.querySelector('#answer-input'),
  keyboard: document.querySelector('#keyboard'),
  reveal: document.querySelector('#reveal-button'),
  next: document.querySelector('#next-button'),
  feedback: document.querySelector('#feedback'),
  streak: document.querySelector('#streak-count'),
  correct: document.querySelector('#correct-count'),
  total: document.querySelector('#total-count'),
};

function currentConfig() {
  return {
    mode: elements.mode.value,
    rangeId: elements.range.value,
    thousandStyle: elements.thousandStyle.value,
  };
}

function updateProgress() {
  elements.streak.textContent = String(state.streak);
  elements.correct.textContent = String(state.correct);
  elements.total.textContent = String(state.total);
}

function setFeedback(message, kind = 'neutral') {
  elements.feedback.textContent = message;
  elements.feedback.dataset.kind = kind;
}

function updateAudioStatus(message = null) {
  const summary = summarizeManifestAvailability(state.audioManifest);
  elements.audioStatus.textContent = message ?? summary.message;
}

async function loadAudioManifest() {
  try {
    const response = await fetch('audio/manifest.json', { cache: 'no-store' });
    if (!response.ok) {
      state.audioManifest = null;
      updateAudioStatus();
      return;
    }

    state.audioManifest = await response.json();
    updateAudioStatus();
    renderQuestion();
  } catch {
    state.audioManifest = null;
    updateAudioStatus('Gemini TTS 音檔：讀取失敗');
  }
}

function updateDialectNote(question) {
  const aliases = question.answer.aliases.filter((alias) => alias.includes('ngàn'));
  elements.dialectNote.textContent = aliases.length > 0
    ? `南越補充：${aliases.slice(0, 2).join(' / ')}`
    : '南越補充：這題目前沒有主要差異。';
}

function updateAudioControls(question) {
  state.currentAudioEntry = findAudioEntryForQuestion(state.audioManifest, question);
  elements.playAudio.hidden = !state.currentAudioEntry;

  if (!state.currentAudioEntry) {
    updateAudioStatus(state.audioManifest ? 'Gemini TTS 音檔：此題尚未產生' : null);
    return;
  }

  elements.playAudio.textContent = '播放 Gemini TTS';
  updateAudioStatus(`Gemini TTS 音檔：${question.audioStyle} 可播放`);
}

function cancelAudioPlayback() {
  if (state.audioController) {
    state.audioController.abort();
    state.audioController = null;
  }
  state.audioPlaybackId += 1;
}

function audioFilesForEntry(entry) {
  return entry.files ?? [entry.file];
}

async function playCurrentAudio() {
  if (!state.currentAudioEntry) return;

  cancelAudioPlayback();

  const playbackId = state.audioPlaybackId;
  state.audioController = new AbortController();
  const files = audioFilesForEntry(state.currentAudioEntry);

  try {
    setFeedback(`正在播放：${state.currentAudioEntry.text}`, 'neutral');
    await playAudioFiles(files, { signal: state.audioController.signal });
  } catch (error) {
    if (playbackId !== state.audioPlaybackId || String(error?.message ?? '').includes('cancelled')) {
      return;
    }
    setFeedback('瀏覽器暫時無法播放音檔，請再按一次播放。', 'error');
  }
}

function answerSummary(question) {
  const aliasText = question.answer.aliases.length > 0
    ? `補充可接受：${question.answer.aliases.slice(0, 2).join(' / ')}`
    : '目前沒有補充別名。';
  return `答案：${question.answer.primary}。${aliasText}`;
}

function renderOptions(question) {
  elements.options.innerHTML = '';
  const isChoiceMode = question.mode === 'choice' || question.mode === 'listening-choice';
  elements.options.hidden = !isChoiceMode;

  if (!isChoiceMode) return;

  for (const value of question.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(value);
    button.addEventListener('click', () => submitAnswer(String(value)));
    elements.options.append(button);
  }
}

function renderKeyboard() {
  elements.keyboard.innerHTML = '';

  for (const group of VIETNAMESE_KEYBOARD_LAYOUT) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.label;
    fieldset.append(legend);

    for (const key of group.keys) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = key.value;
      button.addEventListener('click', () => handleKeyboardKey(key));
      fieldset.append(button);
    }

    elements.keyboard.append(fieldset);
  }
}

function handleKeyboardKey(key) {
  const input = elements.input;
  if (key.type === 'insert') {
    const result = insertVietnameseCharacter(input.value, input.selectionStart, input.selectionEnd, key.value);
    input.value = result.value;
    input.focus();
    input.setSelectionRange(result.selectionStart, result.selectionEnd);
    return;
  }

  if (key.mark === 'clear') {
    input.value = clearVietnameseTone(input.value);
  } else {
    input.value = applyVietnameseTone(input.value, key.mark);
  }
  input.focus();
}

function renderQuestion() {
  cancelAudioPlayback();

  const question = state.question;
  const isTyping = question.mode === 'typing';
  const isFlashcard = question.mode === 'flashcard';
  const isListening = question.mode === 'listening-choice';

  updateDialectNote(question);
  updateAudioControls(question);

  elements.promptLabel.textContent = isListening ? '聽力題' : '題目';
  elements.promptValue.textContent = isListening && state.currentAudioEntry
    ? '請聽音檔後選數字'
    : isListening
      ? question.answer.primary
      : question.prompt;
  elements.vietnameseHint.hidden = true;
  elements.vietnameseHint.textContent = '';
  elements.typingForm.hidden = !isTyping;
  elements.reveal.hidden = !isFlashcard;
  elements.input.value = '';

  renderOptions(question);
  setFeedback(isListening && !state.currentAudioEntry
    ? '聽力音檔尚未產生，暫時顯示越南語輔助。'
    : '準備好了，請作答。');
}

function nextQuestion() {
  state.question = createQuestion(currentConfig());
  renderQuestion();
}

function submitAnswer(answer) {
  const result = checkAnswer(state.question, answer);
  state.total += 1;

  if (result.correct) {
    state.correct += 1;
    state.streak += 1;
    setFeedback(`答對了。${answerSummary(state.question)}`, 'success');
  } else {
    state.streak = 0;
    setFeedback(`再練一次。${answerSummary(state.question)}`, 'error');
  }

  updateProgress();
}

function revealAnswer() {
  elements.vietnameseHint.hidden = false;
  elements.vietnameseHint.textContent = answerSummary(state.question);
  setFeedback('先看答案也可以，等等再下一題。');
}

function bindEvents() {
  elements.mode.addEventListener('change', nextQuestion);
  elements.range.addEventListener('change', nextQuestion);
  elements.thousandStyle.addEventListener('change', nextQuestion);
  elements.next.addEventListener('click', nextQuestion);
  elements.reveal.addEventListener('click', revealAnswer);
  elements.playAudio.addEventListener('click', playCurrentAudio);
  elements.typingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitAnswer(elements.input.value);
  });
}

renderKeyboard();
bindEvents();
updateProgress();
nextQuestion();
loadAudioManifest();
