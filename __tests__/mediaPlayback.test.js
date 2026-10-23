import React, { useEffect } from 'react';
import ReactTestRenderer from 'react-test-renderer';

const mockStorage = new Map();
const mockAudioStatus = {
  currentTime: 0,
  didJustFinish: false,
  duration: 1000,
  error: null,
  isBuffering: false,
  isLoaded: false,
  playing: false,
};
const mockAudioPlayer = {
  clearLockScreenControls: jest.fn(),
  currentTime: 0,
  duration: 1000,
  pause: jest.fn(),
  play: jest.fn(),
  playing: false,
  replace: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setActiveForLockScreen: jest.fn(),
};
const mockVideoListeners = {};
const mockVideoPlayer = {
  addListener: jest.fn((event, listener) => {
    mockVideoListeners[event] = listener;
    return { remove: jest.fn() };
  }),
  currentTime: 0,
  duration: 600,
  pause: jest.fn(),
  play: jest.fn(),
  playing: false,
  replaceAsync: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(mockStorage.get(key) || null)),
  removeItem: jest.fn(key => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
}));

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioPlayer: () => mockAudioPlayer,
  useAudioPlayerStatus: () => mockAudioStatus,
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: (source, setup) => {
    setup?.(mockVideoPlayer);
    return mockVideoPlayer;
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaPlaybackProvider, useMediaPlayback } from '../src/contexts/MediaPlaybackContext';
import { getMediaProgressKey, serializeMediaProgress } from '../src/utils/mediaProgress';

const audio = {
  artwork: 'https://example.test/cover.jpg',
  artist: 'Auteur',
  id: 'audio-1',
  title: 'Livre audio',
  uri: 'https://example.test/audio.mp3',
};

const Probe = ({ onValue }) => {
  const value = useMediaPlayback();
  useEffect(() => onValue(value), [onValue, value]);
  return null;
};

describe('MediaPlaybackProvider', () => {
  let api;
  let renderer;
  const renderProvider = async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MediaPlaybackProvider userId={7}>
          <Probe onValue={value => { api = value; }} />
        </MediaPlaybackProvider>,
      );
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockAudioStatus.currentTime = 0;
    mockAudioStatus.didJustFinish = false;
    mockAudioStatus.isLoaded = false;
    mockAudioStatus.playing = false;
    mockAudioPlayer.currentTime = 0;
    mockAudioPlayer.playing = false;
    mockVideoPlayer.playing = false;
    mockVideoPlayer.currentTime = 0;
    api = null;
  });

  afterEach(() => {
    if (renderer) ReactTestRenderer.act(() => renderer.unmount());
    renderer = null;
  });

  test('keeps one audio player active and registers lock-screen controls', async () => {
    await renderProvider();

    await ReactTestRenderer.act(async () => api.prepareAudio(audio));

    expect(api.activeMedia).toMatchObject({ id: 'audio-1', kind: 'audio' });
    expect(mockAudioPlayer.replace).toHaveBeenCalledWith({ name: 'Livre audio', uri: audio.uri });
    expect(mockAudioPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ artist: 'Auteur', title: 'Livre audio' }),
      expect.objectContaining({ showSeekBackward: true, showSeekForward: true }),
    );
  });

  test('restores a saved position before autoplaying', async () => {
    mockStorage.set(getMediaProgressKey(7, audio), serializeMediaProgress(125, 1000));
    await renderProvider();

    await ReactTestRenderer.act(async () => api.playAudio(audio));
    mockAudioStatus.isLoaded = true;
    await ReactTestRenderer.act(async () => {
      renderer.update(
        <MediaPlaybackProvider userId={7}>
          <Probe onValue={value => { api = value; }} />
        </MediaPlaybackProvider>,
      );
    });

    expect(mockAudioPlayer.seekTo).toHaveBeenCalledWith(125);
    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  test('pauses audio before starting a native video', async () => {
    await renderProvider();
    await ReactTestRenderer.act(async () => api.prepareAudio(audio));

    await ReactTestRenderer.act(async () => api.playVideo({ id: 'video-1', title: 'Vidéo', uri: 'https://example.test/video.mp4' }));

    expect(mockAudioPlayer.pause).toHaveBeenCalled();
    expect(mockAudioPlayer.clearLockScreenControls).toHaveBeenCalled();
    expect(mockVideoPlayer.replaceAsync).toHaveBeenCalledWith({
      metadata: { artist: undefined, artwork: undefined, title: 'Vidéo' },
      uri: 'https://example.test/video.mp4',
    });
    expect(mockVideoPlayer.play).toHaveBeenCalled();
    expect(api.activeMedia).toMatchObject({ id: 'video-1', kind: 'video' });
  });

  test('retries play() when the video becomes ready but did not start', async () => {
    await renderProvider();
    await ReactTestRenderer.act(async () => api.playVideo({ id: 'video-2', title: 'Vidéo 2', uri: 'https://example.test/video-2.mp4' }));
    mockVideoPlayer.play.mockClear();

    await ReactTestRenderer.act(async () => mockVideoListeners.playingChange({ isPlaying: true }));
    await ReactTestRenderer.act(async () => mockVideoListeners.playingChange({ isPlaying: false }));
    await ReactTestRenderer.act(async () => mockVideoListeners.statusChange({ error: null, status: 'readyToPlay' }));
    expect(mockVideoPlayer.play).toHaveBeenCalledTimes(1);

    // A transient playing flag during loading must not cancel the retry, and it only happens once.
    mockVideoPlayer.play.mockClear();
    await ReactTestRenderer.act(async () => mockVideoListeners.statusChange({ error: null, status: 'readyToPlay' }));
    expect(mockVideoPlayer.play).not.toHaveBeenCalled();
  });

  test('resumes a video where the user stopped', async () => {
    const video = { id: 'video-resume', title: 'Vidéo', uri: 'https://example.test/video-resume.mp4' };
    mockStorage.set(getMediaProgressKey(7, video), serializeMediaProgress(120, 600));
    await renderProvider();

    await ReactTestRenderer.act(async () => api.playVideo(video));

    expect(mockVideoPlayer.currentTime).toBe(120);
    expect(mockVideoPlayer.play).toHaveBeenCalled();
  });

  test('starts a video over when it was nearly finished', async () => {
    const video = { id: 'video-done', title: 'Vidéo', uri: 'https://example.test/video-done.mp4' };
    mockStorage.set(getMediaProgressKey(7, video), serializeMediaProgress(595, 600));
    await renderProvider();

    await ReactTestRenderer.act(async () => api.playVideo(video));

    expect(mockVideoPlayer.currentTime).toBe(0);
  });

  test('saves the video position when it is paused', async () => {
    const video = { id: 'video-pause', title: 'Vidéo', uri: 'https://example.test/video-pause.mp4' };
    await renderProvider();
    await ReactTestRenderer.act(async () => api.playVideo(video));
    mockVideoPlayer.currentTime = 42;
    mockVideoPlayer.playing = true;

    await ReactTestRenderer.act(async () => api.playPause());

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(getMediaProgressKey(7, video), expect.stringContaining('"position":42'));
  });

  test('marks a video as completed when it ends', async () => {
    const video = { id: 'video-end', title: 'Vidéo', uri: 'https://example.test/video-end.mp4' };
    await renderProvider();
    await ReactTestRenderer.act(async () => api.playVideo(video));

    await ReactTestRenderer.act(async () => mockVideoListeners.playToEnd());

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(getMediaProgressKey(7, video), expect.stringContaining('"position":600'));
  });

  test('persists audio progress when the player is closed', async () => {
    await renderProvider();
    await ReactTestRenderer.act(async () => api.prepareAudio(audio));
    mockAudioPlayer.currentTime = 240;

    await ReactTestRenderer.act(async () => api.stop());

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getMediaProgressKey(7, audio),
      expect.stringContaining('"position":240'),
    );
    expect(api.activeMedia).toBeNull();
  });

  describe('queue', () => {
    const tracks = [1, 2, 3].map(number => ({
      id: `track-${number}`,
      kind: 'audio',
      title: `Piste ${number}`,
      uri: `https://example.test/track-${number}.mp3`,
    }));
    const rerender = () => ReactTestRenderer.act(async () => {
      renderer.update(
        <MediaPlaybackProvider userId={7}>
          <Probe onValue={value => { api = value; }} />
        </MediaPlaybackProvider>,
      );
    });

    test('plays a queue from a start index and exposes its position', async () => {
      await renderProvider();

      await ReactTestRenderer.act(async () => api.playQueue(tracks, 1));

      expect(api.activeMedia).toMatchObject({ id: 'track-2', kind: 'audio' });
      expect(api.queue).toHaveLength(3);
      expect(api.queueIndex).toBe(1);
      expect(api.hasNext).toBe(true);
    });

    test('moves to the next and previous items', async () => {
      await renderProvider();
      await ReactTestRenderer.act(async () => api.playQueue(tracks, 0));

      await ReactTestRenderer.act(async () => api.next());
      expect(api.activeMedia.id).toBe('track-2');

      await ReactTestRenderer.act(async () => api.previous());
      expect(api.activeMedia.id).toBe('track-1');
    });

    test('restarts the current item instead of going back after the first seconds', async () => {
      await renderProvider();
      await ReactTestRenderer.act(async () => api.playQueue(tracks, 1));
      mockAudioPlayer.currentTime = 40;

      await ReactTestRenderer.act(async () => api.previous());

      expect(api.activeMedia.id).toBe('track-2');
      expect(mockAudioPlayer.seekTo).toHaveBeenCalledWith(0);
    });

    test('advances automatically when an audio item finishes', async () => {
      await renderProvider();
      await ReactTestRenderer.act(async () => api.playQueue(tracks, 0));

      mockAudioStatus.didJustFinish = true;
      await rerender();

      expect(api.activeMedia.id).toBe('track-2');
    });

    test('stops at the end of the queue', async () => {
      await renderProvider();
      await ReactTestRenderer.act(async () => api.playQueue(tracks, 2));

      mockAudioStatus.didJustFinish = true;
      await rerender();

      expect(api.activeMedia.id).toBe('track-3');
      expect(api.hasNext).toBe(false);
    });

    test('advances to the next video episode when playback ends', async () => {
      await renderProvider();
      const episodes = [1, 2].map(number => ({ id: `ep-${number}`, kind: 'video', title: `Ep ${number}`, uri: `https://example.test/ep-${number}.mp4` }));
      await ReactTestRenderer.act(async () => api.playQueue(episodes, 0));

      await ReactTestRenderer.act(async () => mockVideoListeners.playToEnd());

      expect(api.activeMedia.id).toBe('ep-2');
    });

    test('ignores a queue that does not contain the active media', async () => {
      await renderProvider();
      await ReactTestRenderer.act(async () => api.playQueue(tracks, 0));

      await ReactTestRenderer.act(async () => api.playAudio(audio));

      expect(api.queue).toEqual([]);
      expect(api.hasNext).toBe(false);
    });
  });
});
