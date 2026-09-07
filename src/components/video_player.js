import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';

// Keep one video implementation aligned with expo-audio's native Media3 version.
const VideoPlayer = forwardRef(function VideoPlayer({
  source,
  style,
  controls = false,
  resizeMode = 'contain',
  paused = false,
  onLoadStart,
  onLoad,
  onProgress,
  onError,
}, ref) {
  const callbacks = useRef({});
  callbacks.current = { onLoadStart, onLoad, onProgress, onError };
  const player = useVideoPlayer(source, instance => {
    instance.timeUpdateEventInterval = 0.25;
  });

  useImperativeHandle(ref, () => ({
    seek(seconds) {
      player.currentTime = seconds;
    },
  }), [player]);

  useEffect(() => {
    let loaded = false;
    callbacks.current.onLoadStart?.();
    const handleStatus = ({ status, error }) => {
      if (status === 'readyToPlay' && !loaded) {
        loaded = true;
        callbacks.current.onLoad?.({ duration: player.duration });
      } else if (status === 'error') {
        callbacks.current.onError?.(error);
      }
    };
    const statusSubscription = player.addListener('statusChange', handleStatus);
    const progressSubscription = player.addListener('timeUpdate', event => {
      callbacks.current.onProgress?.({ currentTime: event.currentTime });
    });
    // Cached/local sources can become ready before the effect subscribes.
    handleStatus({ status: player.status });
    return () => {
      statusSubscription.remove();
      progressSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [paused, player]);

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls={controls}
      contentFit={resizeMode}
      fullscreenOptions={{ enable: true }}
    />
  );
});

export default VideoPlayer;
