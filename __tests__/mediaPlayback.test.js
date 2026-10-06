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
});
