function playbackCancelledError() {
  return new Error('Audio playback cancelled');
}

function playOneAudioFile(audio, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      audio.pause?.();
      reject(playbackCancelledError());
      return;
    }

    let settled = false;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    const handleEnded = () => {
      settle(resolve);
    };

    const handleError = () => {
      settle(reject, new Error('Audio playback failed'));
    };

    const handleAbort = () => {
      audio.pause?.();
      settle(reject, playbackCancelledError());
    };

    const cleanup = () => {
      audio.removeEventListener?.('ended', handleEnded);
      audio.removeEventListener?.('error', handleError);
      signal?.removeEventListener?.('abort', handleAbort);
    };

    audio.addEventListener?.('ended', handleEnded, { once: true });
    audio.addEventListener?.('error', handleError, { once: true });
    signal?.addEventListener?.('abort', handleAbort, { once: true });

    Promise.resolve(audio.play()).catch((error) => {
      settle(reject, error);
    });
  });
}

export async function playAudioFiles(files, { createAudio = (file) => new Audio(file), signal = null } = {}) {
  for (const file of files) {
    if (signal?.aborted) throw playbackCancelledError();

    const audio = createAudio(file);
    await playOneAudioFile(audio, signal);
  }
}
