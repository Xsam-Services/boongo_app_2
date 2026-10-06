import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer } from 'expo-video';

import { getMediaIdentity, getMediaProgressKey, getResumePosition, serializeMediaProgress } from '../utils/mediaProgress';

const EMPTY_VIDEO_STATUS = {
  currentTime: 0,
  duration: 0,
  error: null,
  isBuffering: false,
  isLoaded: false,
  playing: false,
};

const MediaPlaybackContext = createContext(null);

const decodeMediaUri = uri => {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
};

export const MediaPlaybackProvider = ({ children, userId }) => {
  const audioPlayer = useAudioPlayer(null, { keepAudioSessionActive: true, updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const videoPlayer = useVideoPlayer(null, player => {
    player.timeUpdateEventInterval = 0.5;
    player.staysActiveInBackground = true;
    player.showNowPlayingNotification = true;
  });
  const [activeMedia, setActiveMedia] = useState(null);
  const [pendingAudioStart, setPendingAudioStart] = useState(null);
  const [videoStatus, setVideoStatus] = useState(EMPTY_VIDEO_STATUS);
  const activeMediaRef = useRef(null);
  const loadSequenceRef = useRef(0);
  const completedMediaRef = useRef(null);

  const updateActiveMedia = useCallback(media => {
    activeMediaRef.current = media;
    setActiveMedia(media);
  }, []);

  const persistAudioProgress = useCallback(async (media = activeMediaRef.current) => {
    if (!media || media.kind !== 'audio') return;

    try {
      await AsyncStorage.setItem(
        getMediaProgressKey(userId, media),
        serializeMediaProgress(audioPlayer.currentTime, audioPlayer.duration),
      );
    } catch {
      // Playback must remain usable if local storage is unavailable.
    }
  }, [audioPlayer, userId]);

  const deactivateAudio = useCallback((saveProgress = true) => {
    if (saveProgress) persistAudioProgress();
    audioPlayer.pause();
    audioPlayer.clearLockScreenControls();
  }, [audioPlayer, persistAudioProgress]);

  const prepareAudio = useCallback((media, autoplay = false) => {
    if (!media?.uri) return;

    const normalizedMedia = { ...media, id: getMediaIdentity(media), kind: 'audio' };
    const currentMedia = activeMediaRef.current;
    if (currentMedia?.kind === 'audio' && getMediaIdentity(currentMedia) === normalizedMedia.id) {
      if (autoplay) {
        if (pendingAudioStart) {
          setPendingAudioStart(current => current ? { ...current, autoplay: true } : current);
        } else {
          audioPlayer.play();
        }
      }
      return;
    }

    loadSequenceRef.current += 1;
    const sequence = loadSequenceRef.current;
    if (currentMedia?.kind === 'audio') persistAudioProgress(currentMedia);
    audioPlayer.pause();
    audioPlayer.clearLockScreenControls();
    videoPlayer.pause();
    audioPlayer.replace({ uri: decodeMediaUri(normalizedMedia.uri), name: normalizedMedia.title });
    audioPlayer.setActiveForLockScreen(true, {
      artworkUrl: normalizedMedia.artwork,
      artist: normalizedMedia.artist,
      title: normalizedMedia.title,
    }, {
      showSeekBackward: true,
      showSeekForward: true,
    });
    completedMediaRef.current = null;
    updateActiveMedia(normalizedMedia);
    setPendingAudioStart({ autoplay, id: normalizedMedia.id, position: 0, ready: false });

    AsyncStorage.getItem(getMediaProgressKey(userId, normalizedMedia))
      .then(storedValue => {
        if (sequence !== loadSequenceRef.current) return;
        setPendingAudioStart(current => current?.id === normalizedMedia.id
          ? { ...current, position: getResumePosition(storedValue), ready: true }
          : current);
      })
      .catch(() => {
        if (sequence === loadSequenceRef.current) {
          setPendingAudioStart(current => current?.id === normalizedMedia.id
            ? { ...current, ready: true }
            : current);
        }
      });
  }, [audioPlayer, pendingAudioStart, persistAudioProgress, updateActiveMedia, userId, videoPlayer]);

  const playAudio = useCallback(media => {
    prepareAudio(media, true);
  }, [prepareAudio]);

  const playVideo = useCallback(async (media, forceReload = false) => {
    if (!media?.uri) return;

    const normalizedMedia = { ...media, id: getMediaIdentity(media), kind: 'video' };
    const currentMedia = activeMediaRef.current;
    if (!forceReload && currentMedia?.kind === 'video' && getMediaIdentity(currentMedia) === normalizedMedia.id) {
      videoPlayer.play();
      return;
    }

    loadSequenceRef.current += 1;
    setPendingAudioStart(null);
    if (currentMedia?.kind === 'audio') deactivateAudio(true);
    videoPlayer.pause();
    updateActiveMedia(normalizedMedia);
    setVideoStatus(EMPTY_VIDEO_STATUS);

    try {
      await videoPlayer.replaceAsync({
        metadata: {
          artist: normalizedMedia.artist,
          artwork: normalizedMedia.artwork,
          title: normalizedMedia.title,
        },
        uri: decodeMediaUri(normalizedMedia.uri),
      });
      if (getMediaIdentity(activeMediaRef.current) === normalizedMedia.id) videoPlayer.play();
    } catch (error) {
      setVideoStatus(current => ({ ...current, error, isBuffering: false }));
    }
  }, [deactivateAudio, updateActiveMedia, videoPlayer]);

  const pause = useCallback(() => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') {
      audioPlayer.pause();
      persistAudioProgress(media);
    } else if (media?.kind === 'video') {
      videoPlayer.pause();
    }
  }, [audioPlayer, persistAudioProgress, videoPlayer]);

  const playPause = useCallback(() => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') {
      if (audioPlayer.playing) {
        pause();
      } else {
        audioPlayer.play();
      }
    } else if (media?.kind === 'video') {
      if (videoPlayer.playing) videoPlayer.pause();
      else videoPlayer.play();
    }
  }, [audioPlayer, pause, videoPlayer]);

  const seekTo = useCallback(seconds => {
    const media = activeMediaRef.current;
    const duration = media?.kind === 'audio' ? audioPlayer.duration : videoPlayer.duration;
    const target = Math.max(0, Math.min(Number(duration) || 0, Number(seconds) || 0));
    if (media?.kind === 'audio') audioPlayer.seekTo(target);
    else if (media?.kind === 'video') videoPlayer.currentTime = target;
  }, [audioPlayer, videoPlayer]);

  const seekBy = useCallback(seconds => {
    const media = activeMediaRef.current;
    const position = media?.kind === 'audio' ? audioPlayer.currentTime : videoPlayer.currentTime;
    seekTo((Number(position) || 0) + seconds);
  }, [audioPlayer, seekTo, videoPlayer]);

  const stop = useCallback(() => {
    loadSequenceRef.current += 1;
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') deactivateAudio(true);
    videoPlayer.pause();
    setPendingAudioStart(null);
    updateActiveMedia(null);
  }, [deactivateAudio, updateActiveMedia, videoPlayer]);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const statusSubscription = videoPlayer.addListener('statusChange', ({ error, status }) => {
      setVideoStatus(current => ({
        ...current,
        duration: videoPlayer.duration || 0,
        error: status === 'error' ? error : null,
        isBuffering: status === 'loading',
        isLoaded: status === 'readyToPlay',
      }));
    });
    const playingSubscription = videoPlayer.addListener('playingChange', ({ isPlaying }) => {
      setVideoStatus(current => ({ ...current, playing: isPlaying }));
    });
    const timeSubscription = videoPlayer.addListener('timeUpdate', ({ currentTime }) => {
      setVideoStatus(current => ({ ...current, currentTime, duration: videoPlayer.duration || current.duration }));
    });
    const endSubscription = videoPlayer.addListener('playToEnd', () => {
      setVideoStatus(current => ({ ...current, currentTime: current.duration, playing: false }));
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [videoPlayer]);

  useEffect(() => {
    if (!pendingAudioStart?.ready || !audioStatus.isLoaded) return;
    if (activeMediaRef.current?.kind !== 'audio' || getMediaIdentity(activeMediaRef.current) !== pendingAudioStart.id) return;

    const startPlayback = async () => {
      if (pendingAudioStart.position > 0) await audioPlayer.seekTo(pendingAudioStart.position);
      if (pendingAudioStart.autoplay) audioPlayer.play();
      setPendingAudioStart(null);
    };
    startPlayback();
  }, [audioPlayer, audioStatus.isLoaded, pendingAudioStart]);

  useEffect(() => {
    if (activeMedia?.kind !== 'audio' || !audioStatus.playing) return undefined;
    const interval = setInterval(() => persistAudioProgress(activeMedia), 5000);
    return () => {
      clearInterval(interval);
      persistAudioProgress(activeMedia);
    };
  }, [activeMedia, audioStatus.playing, persistAudioProgress]);

  useEffect(() => {
    if (!audioStatus.didJustFinish || activeMedia?.kind !== 'audio') return;
    const mediaId = getMediaIdentity(activeMedia);
    if (completedMediaRef.current === mediaId) return;

    completedMediaRef.current = mediaId;
    AsyncStorage.removeItem(getMediaProgressKey(userId, activeMedia)).catch(() => {});
    audioPlayer.seekTo(0);
  }, [activeMedia, audioPlayer, audioStatus.didJustFinish, userId]);

  useEffect(() => () => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') persistAudioProgress(media);
    audioPlayer.clearLockScreenControls();
  }, [audioPlayer, persistAudioProgress]);

  const status = useMemo(() => activeMedia?.kind === 'video' ? videoStatus : ({
    currentTime: audioStatus.currentTime || 0,
    duration: audioStatus.duration || 0,
    error: audioStatus.error,
    isBuffering: audioStatus.isBuffering,
    isLoaded: audioStatus.isLoaded,
    playing: audioStatus.playing,
  }), [
    activeMedia?.kind,
    audioStatus.currentTime,
    audioStatus.duration,
    audioStatus.error,
    audioStatus.isBuffering,
    audioStatus.isLoaded,
    audioStatus.playing,
    videoStatus,
  ]);

  const value = useMemo(() => ({
    activeMedia,
    pause,
    playAudio,
    playPause,
    playVideo,
    prepareAudio,
    seekBy,
    seekTo,
    status,
    stop,
    videoPlayer,
  }), [activeMedia, pause, playAudio, playPause, playVideo, prepareAudio, seekBy, seekTo, status, stop, videoPlayer]);

  return <MediaPlaybackContext.Provider value={value}>{children}</MediaPlaybackContext.Provider>;
};

export const useMediaPlayback = () => {
  const context = useContext(MediaPlaybackContext);
  if (!context) throw new Error('useMediaPlayback must be used inside MediaPlaybackProvider');
  return context;
};

export default MediaPlaybackContext;
