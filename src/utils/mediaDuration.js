import { createAudioPlayer } from 'expo-audio';

const POLL_MS = 200;

/**
 * Length in whole seconds of a local audio file (0 when it cannot be read in time).
 * Loads the file in a throw-away player: nothing is played.
 */
export const measureAudioDuration = (uri, timeoutMs = 8000) => new Promise(resolve => {
  let player = null;
  let finished = false;
  let poll = null;
  let timer = null;

  const finish = seconds => {
    if (finished) return;
    finished = true;
    clearInterval(poll);
    clearTimeout(timer);
    try {
      player?.remove();
    } catch (error) {
      // The player may already be released.
    }
    resolve(Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0);
  };

  try {
    player = createAudioPlayer({ uri });
    poll = setInterval(() => {
      if (player?.isLoaded && player.duration > 0) finish(player.duration);
    }, POLL_MS);
    timer = setTimeout(() => finish(player?.duration || 0), timeoutMs);
  } catch (error) {
    finish(0);
  }
});

/** ImagePicker gives a video length in milliseconds. */
export const secondsFromMilliseconds = value => (Number.isFinite(value) && value > 0 ? Math.round(value / 1000) : 0);
