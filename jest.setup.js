/* global jest */

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-localize', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getLocales: jest.fn(() => [{ countryCode: 'CD', languageCode: 'fr', languageTag: 'fr-CD', isRTL: false }]),
}));

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioPlayer: jest.fn(() => ({
    clearLockScreenControls: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    currentTime: 0,
    didJustFinish: false,
    duration: 0,
    isBuffering: false,
    isLoaded: false,
    playing: false,
  })),
}));

jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    pause: jest.fn(),
    play: jest.fn(),
    replaceAsync: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
