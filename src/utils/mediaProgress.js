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
