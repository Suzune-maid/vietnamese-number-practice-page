import test from 'node:test';
import assert from 'node:assert/strict';

import { playAudioFiles } from '../src/audio-player.js';

class FakeAudio {
  constructor(file, events) {
    this.file = file;
    this.events = events;
    this.listeners = new Map();
  }

  addEventListener(name, listener, options = {}) {
    this.listeners.set(name, { listener, once: options.once === true });
  }

  removeEventListener(name) {
    this.listeners.delete(name);
  }

  async play() {
    this.events.push(`play:${this.file}`);
  }

  pause() {
    this.events.push(`pause:${this.file}`);
  }

  finish() {
    const event = this.listeners.get('ended');
    event?.listener();
    if (event?.once) this.listeners.delete('ended');
  }
}

function flushPlaybackSetup() {
  return new Promise((resolve) => setImmediate(resolve));
}

test('plays audio files sequentially and waits for each ended event', async () => {
  const events = [];
  const created = [];
  const playPromise = playAudioFiles(['a.wav', 'b.wav'], {
    createAudio: (file) => {
      const audio = new FakeAudio(file, events);
      created.push(audio);
      return audio;
    },
  });

  await flushPlaybackSetup();
  assert.deepEqual(events, ['play:a.wav']);

  created[0].finish();
  await flushPlaybackSetup();
  assert.deepEqual(events, ['play:a.wav', 'play:b.wav']);

  created[1].finish();
  await playPromise;
  assert.deepEqual(events, ['play:a.wav', 'play:b.wav']);
});

test('stops the previous clip when playback is cancelled', async () => {
  const events = [];
  const created = [];
  const controller = new AbortController();
  const playPromise = playAudioFiles(['a.wav', 'b.wav'], {
    createAudio: (file) => {
      const audio = new FakeAudio(file, events);
      created.push(audio);
      return audio;
    },
    signal: controller.signal,
  });

  await flushPlaybackSetup();
  controller.abort();
  await assert.rejects(playPromise, /cancelled/);
  assert.deepEqual(events, ['play:a.wav', 'pause:a.wav']);
});

test('stops the current clip when cancelled before play resolves', async () => {
  const events = [];
  const controller = new AbortController();
  const playPromise = playAudioFiles(['a.wav'], {
    createAudio: (file) => ({
      file,
      addEventListener() {},
      removeEventListener() {},
      play() {
        events.push(`play:${file}`);
        return new Promise(() => {});
      },
      pause() { events.push(`pause:${file}`); },
    }),
    signal: controller.signal,
  });

  await flushPlaybackSetup();
  controller.abort();

  const outcome = await Promise.race([
    playPromise.then(() => 'resolved', () => 'rejected'),
    new Promise((resolve) => setTimeout(() => resolve('pending'), 20)),
  ]);

  assert.equal(outcome, 'rejected');
  assert.deepEqual(events, ['play:a.wav', 'pause:a.wav']);
});
