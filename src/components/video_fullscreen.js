import React from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';
import { VideoView } from 'expo-video';

import { PlayerVideoControls, useControlLabels, useControlsVisibility } from './video_controls';

/**
 * Full-screen video in a landscape modal with its own controls and close button.
 * It replaces the native full-screen player, whose rotation and close button depend on the
 * app-wide orientation lock.
 */
const VideoFullscreen = ({ currentTime, duration, muted, onClose, onPlayPause, onSeek, onSeekBy, onToggleMute, playing, player, title, visible }) => {
  const labels = useControlLabels();
  const controls = useControlsVisibility(playing);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      visible={visible}
    >
      <StatusBar hidden />
      <View style={styles.screen}>
        {visible ? <VideoView contentFit="contain" nativeControls={false} player={player} style={StyleSheet.absoluteFill} /> : null}
        <PlayerVideoControls
          currentTime={currentTime}
          duration={duration}
          labels={labels}
          muted={muted}
          onClose={onClose}
          onPlayPause={onPlayPause}
          onSeek={onSeek}
          onSeekBy={onSeekBy}
          onToggle={controls.toggle}
          onToggleMute={onToggleMute}
          onTouch={controls.touch}
          playing={playing}
          title={title}
          visible={controls.visible}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#000000', flex: 1 },
});

export default VideoFullscreen;
