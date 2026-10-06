import { getMediaIdentity, getMediaProgressKey, getResumePosition, serializeMediaProgress } from '../src/utils/mediaProgress';

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
