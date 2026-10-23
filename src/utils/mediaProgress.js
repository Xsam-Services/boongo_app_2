const MINIMUM_RESUME_POSITION = 5;
const COMPLETION_THRESHOLD = 10;

export const getMediaIdentity = media => String(media?.id || media?.uri || 'unknown');

export const getMediaProgressKey = (userId, media) => (
  `media-progress:${encodeURIComponent(String(userId || 'guest'))}:${encodeURIComponent(getMediaIdentity(media))}`
);

export const serializeMediaProgress = (position, duration) => JSON.stringify({
  duration: Number(duration) || 0,
  position: Number(position) || 0,
  updatedAt: Date.now(),
});

export const getResumePosition = (storedValue, knownDuration = 0) => {
  if (!storedValue) return 0;

  try {
    const parsed = JSON.parse(storedValue);
    const position = Number(parsed?.position) || 0;
    const duration = Number(knownDuration) || Number(parsed?.duration) || 0;

    if (position <= MINIMUM_RESUME_POSITION) return 0;
    if (duration > 0 && duration - position <= COMPLETION_THRESHOLD) return 0;
    return position;
  } catch {
    return 0;
  }
};

/**
 * Summarises a stored progress value for display: how far the user got and whether they finished.
 * A value left within the completion threshold of the end counts as finished.
 */
export const getProgressSummary = storedValue => {
  if (!storedValue) return { completed: false, position: 0, ratio: 0 };

  try {
    const parsed = JSON.parse(storedValue);
    const position = Number(parsed?.position) || 0;
    const duration = Number(parsed?.duration) || 0;
    if (duration <= 0 || position <= MINIMUM_RESUME_POSITION) return { completed: false, position: 0, ratio: 0 };

    const completed = duration - position <= COMPLETION_THRESHOLD;
    return { completed, position, ratio: completed ? 1 : Math.min(1, position / duration) };
  } catch {
    return { completed: false, position: 0, ratio: 0 };
  }
};
