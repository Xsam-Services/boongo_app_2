import { measureAudioDuration, secondsFromMilliseconds } from '../src/utils/mediaDuration';

const mockPlayer = { duration: 0, isLoaded: false, remove: jest.fn() };

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(() => mockPlayer) }));

describe('measureAudioDuration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPlayer.duration = 0;
    mockPlayer.isLoaded = false;
    mockPlayer.remove.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('resolves with the rounded duration once the file is loaded and releases the player', async () => {
    const result = measureAudioDuration('file:///a.mp3');
    mockPlayer.duration = 184.6;
    mockPlayer.isLoaded = true;
    jest.advanceTimersByTime(250);

    await expect(result).resolves.toBe(185);
    expect(mockPlayer.remove).toHaveBeenCalled();
  });

  it('resolves with 0 when the file cannot be read in time', async () => {
    const result = measureAudioDuration('file:///broken.mp3', 1000);
    jest.advanceTimersByTime(1100);

    await expect(result).resolves.toBe(0);
    expect(mockPlayer.remove).toHaveBeenCalled();
  });
});

describe('secondsFromMilliseconds', () => {
  it('converts picker durations and ignores missing ones', () => {
    expect(secondsFromMilliseconds(15720)).toBe(16);
    expect(secondsFromMilliseconds(null)).toBe(0);
    expect(secondsFromMilliseconds(undefined)).toBe(0);
  });
});
