import { getMediaIdentity, getMediaProgressKey, getProgressSummary, getResumePosition, serializeMediaProgress } from '../src/utils/mediaProgress';

describe('media progress', () => {
  test('uses a stable media id and separates progress by user', () => {
    expect(getMediaIdentity({ id: 42, uri: 'https://example.test/audio.mp3' })).toBe('42');
    expect(getMediaIdentity({ uri: 'https://example.test/audio.mp3' })).toBe('https://example.test/audio.mp3');
    expect(getMediaProgressKey(7, { id: 42 })).not.toBe(getMediaProgressKey(8, { id: 42 }));
  });

  test('restores a meaningful unfinished position', () => {
    expect(getResumePosition(serializeMediaProgress(125, 1000))).toBe(125);
  });

  test('does not restore the beginning or a completed media', () => {
    expect(getResumePosition(serializeMediaProgress(5, 1000))).toBe(0);
    expect(getResumePosition(serializeMediaProgress(995, 1000))).toBe(0);
    expect(getResumePosition('invalid-json')).toBe(0);
  });
});

describe('progress summary', () => {
  const stored = (position, duration) => serializeMediaProgress(position, duration);

  test('reports how far the user got', () => {
    expect(getProgressSummary(stored(30, 100))).toEqual({ completed: false, position: 30, ratio: 0.3 });
  });

  test('treats a value left near the end as completed', () => {
    expect(getProgressSummary(stored(95, 100))).toEqual({ completed: true, position: 95, ratio: 1 });
    expect(getProgressSummary(stored(100, 100)).completed).toBe(true);
  });

  test('ignores tiny, missing or unreadable progress', () => {
    expect(getProgressSummary(stored(3, 100)).ratio).toBe(0);
    expect(getProgressSummary(null).ratio).toBe(0);
    expect(getProgressSummary('not json').ratio).toBe(0);
    expect(getProgressSummary(stored(10, 0)).ratio).toBe(0);
  });
});
