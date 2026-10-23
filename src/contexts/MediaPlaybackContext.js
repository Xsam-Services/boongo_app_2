import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer } from 'expo-video';

import { resolveQueuePosition } from '../utils/mediaCollection';
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
  const finishHandledRef = useRef(false);
  const pendingVideoPlayRef = useRef(null);
  const queueRef = useRef([]);
  const advanceRef = useRef(null);
  const [queue, setQueueState] = useState([]);

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

  const persistVideoProgress = useCallback(async (media = activeMediaRef.current) => {
    if (!media || media.kind !== 'video') return;

    try {
      await AsyncStorage.setItem(
        getMediaProgressKey(userId, media),
        serializeMediaProgress(videoPlayer.currentTime, videoPlayer.duration),
      );
    } catch {
      // Playback must remain usable if local storage is unavailable.
    }
  }, [userId, videoPlayer]);

  const markVideoCompleted = useCallback(async () => {
    const media = activeMediaRef.current;
    if (media?.kind !== 'video') return;

    const duration = Number(videoPlayer.duration) || 0;
    try {
      await AsyncStorage.setItem(getMediaProgressKey(userId, media), serializeMediaProgress(duration, duration));
    } catch {
      // Playback must remain usable if local storage is unavailable.
    }
  }, [userId, videoPlayer]);

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
    if (currentMedia?.kind === 'video') persistVideoProgress(currentMedia);
    audioPlayer.pause();
    audioPlayer.clearLockScreenControls();
    videoPlayer.pause();
    pendingVideoPlayRef.current = null;
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
  }, [audioPlayer, pendingAudioStart, persistAudioProgress, persistVideoProgress, updateActiveMedia, userId, videoPlayer]);

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
    if (currentMedia?.kind === 'video') persistVideoProgress(currentMedia);
    videoPlayer.pause();
    // Keep the intent to play until the player is ready: a play() issued during the source swap
    // is sometimes lost, notably when chaining queue items.
    pendingVideoPlayRef.current = normalizedMedia.id;
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
      if (getMediaIdentity(activeMediaRef.current) !== normalizedMedia.id) return;

      // Start where the user stopped last time, unless they had (nearly) finished it.
      try {
        const resumeAt = getResumePosition(await AsyncStorage.getItem(getMediaProgressKey(userId, normalizedMedia)), videoPlayer.duration);
        if (resumeAt > 0 && getMediaIdentity(activeMediaRef.current) === normalizedMedia.id) videoPlayer.currentTime = resumeAt;
      } catch {
        // Starting from the beginning is a fine fallback.
      }
      if (getMediaIdentity(activeMediaRef.current) === normalizedMedia.id) videoPlayer.play();
    } catch (error) {
      setVideoStatus(current => ({ ...current, error, isBuffering: false }));
    }
  }, [deactivateAudio, persistVideoProgress, updateActiveMedia, userId, videoPlayer]);

  const pause = useCallback(() => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') {
      audioPlayer.pause();
      persistAudioProgress(media);
    } else if (media?.kind === 'video') {
      videoPlayer.pause();
      persistVideoProgress(media);
    }
  }, [audioPlayer, persistAudioProgress, persistVideoProgress, videoPlayer]);

  const playPause = useCallback(() => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') {
      if (audioPlayer.playing) {
        pause();
      } else {
        audioPlayer.play();
      }
    } else if (media?.kind === 'video') {
      if (videoPlayer.playing) pause();
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

  const setQueue = useCallback(items => {
    const nextQueue = Array.isArray(items) ? items : [];
    queueRef.current = nextQueue;
    setQueueState(nextQueue);
  }, []);

  const startQueueItem = useCallback(item => {
    if (!item) return;
    if (item.kind === 'video') playVideo(item);
    else playAudio(item);
  }, [playAudio, playVideo]);

  const playQueue = useCallback((items, startIndex = 0) => {
    setQueue(items);
    startQueueItem(items?.[startIndex]);
  }, [setQueue, startQueueItem]);

  const next = useCallback(() => {
    const { next: nextItem } = resolveQueuePosition(queueRef.current, activeMediaRef.current);
    startQueueItem(nextItem);
  }, [startQueueItem]);

  const previous = useCallback(() => {
    const media = activeMediaRef.current;
    const position = Number(media?.kind === 'video' ? videoPlayer.currentTime : audioPlayer.currentTime) || 0;
    const { previous: previousItem } = resolveQueuePosition(queueRef.current, media);
    if (previousItem && position <= 3) startQueueItem(previousItem);
    else seekTo(0);
  }, [audioPlayer, seekTo, startQueueItem, videoPlayer]);

  const stop = useCallback(() => {
    loadSequenceRef.current += 1;
    pendingVideoPlayRef.current = null;
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') deactivateAudio(true);
    if (media?.kind === 'video') persistVideoProgress(media);
    videoPlayer.pause();
    setPendingAudioStart(null);
    updateActiveMedia(null);
  }, [deactivateAudio, persistVideoProgress, updateActiveMedia, videoPlayer]);

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
      if (status === 'readyToPlay' && pendingVideoPlayRef.current) {
        const shouldPlay = pendingVideoPlayRef.current === getMediaIdentity(activeMediaRef.current);
        pendingVideoPlayRef.current = null;
        // The player can flip playing on and off while loading and end up ready but stopped.
        if (shouldPlay && !videoPlayer.playing) videoPlayer.play();
      }
    });
    const playingSubscription = videoPlayer.addListener('playingChange', ({ isPlaying }) => {
      setVideoStatus(current => ({ ...current, playing: isPlaying }));
    });
    const timeSubscription = videoPlayer.addListener('timeUpdate', ({ currentTime }) => {
      setVideoStatus(current => ({ ...current, currentTime, duration: videoPlayer.duration || current.duration }));
    });
    const endSubscription = videoPlayer.addListener('playToEnd', () => {
      setVideoStatus(current => ({ ...current, currentTime: current.duration, playing: false }));
      markVideoCompleted();
      advanceRef.current?.();
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [markVideoCompleted, videoPlayer]);

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
    if (activeMedia?.kind !== 'video' || !videoStatus.playing) return undefined;
    const interval = setInterval(() => persistVideoProgress(activeMedia), 5000);
    return () => clearInterval(interval);
  }, [activeMedia, persistVideoProgress, videoStatus.playing]);

  useEffect(() => {
    if (!audioStatus.didJustFinish) {
      finishHandledRef.current = false;
      return;
    }
    if (finishHandledRef.current || activeMedia?.kind !== 'audio') return;
    finishHandledRef.current = true;
    const mediaId = getMediaIdentity(activeMedia);
    if (completedMediaRef.current === mediaId) return;

    completedMediaRef.current = mediaId;
    const duration = Number(audioPlayer.duration) || 0;
    AsyncStorage.setItem(getMediaProgressKey(userId, activeMedia), serializeMediaProgress(duration, duration)).catch(() => {});
    audioPlayer.seekTo(0);
    advanceRef.current?.();
  }, [activeMedia, audioPlayer, audioStatus.didJustFinish, userId]);

  useEffect(() => {
    advanceRef.current = next;
  }, [next]);

  useEffect(() => () => {
    const media = activeMediaRef.current;
    if (media?.kind === 'audio') persistAudioProgress(media);
    if (media?.kind === 'video') persistVideoProgress(media);
    try {
      audioPlayer.clearLockScreenControls();
    } catch {
      // The native player may already be released when the provider unmounts (e.g. dev reload).
    }
  }, [audioPlayer, persistAudioProgress, persistVideoProgress]);

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

  const queuePosition = useMemo(() => resolveQueuePosition(queue, activeMedia), [activeMedia, queue]);

  const value = useMemo(() => ({
    activeMedia,
    hasNext: Boolean(queuePosition.next),
    hasPrevious: queuePosition.index >= 0,
    next,
    pause,
    playAudio,
    playPause,
    playQueue,
    playVideo,
    prepareAudio,
    previous,
    queue: queuePosition.index >= 0 ? queue : [],
    queueIndex: queuePosition.index,
    seekBy,
    seekTo,
    setQueue,
    status,
    stop,
    videoPlayer,
  }), [activeMedia, next, pause, playAudio, playPause, playQueue, playVideo, prepareAudio, previous, queue, queuePosition, seekBy, seekTo, setQueue, status, stop, videoPlayer]);

  return <MediaPlaybackContext.Provider value={value}>{children}</MediaPlaybackContext.Provider>;
};

export const useMediaPlayback = () => {
  const context = useContext(MediaPlaybackContext);
  if (!context) throw new Error('useMediaPlayback must be used inside MediaPlaybackProvider');
  return context;
};

export default MediaPlaybackContext;
