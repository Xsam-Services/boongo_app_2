import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { formatDuration } from '../utils/mediaCollection';

const HIDE_DELAY_MS = 3000;
const SCRIM = 'rgba(0, 0, 0, 0.38)';

/**
 * Shows the controls over a video and hides them a few seconds after the last interaction
 * while the video is playing. Tapping the video toggles them.
 */
export const useControlsVisibility = playing => {
  const [visible, setVisible] = useState(true);
  const [interactions, setInteractions] = useState(0);

  useEffect(() => {
    if (!visible || !playing) return undefined;
    const timer = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [interactions, playing, visible]);

  const touch = useCallback(() => setInteractions(count => count + 1), []);
  const toggle = useCallback(() => {
    setVisible(current => !current);
    setInteractions(count => count + 1);
  }, []);

  return { toggle, touch, visible };
};

export const useControlLabels = () => {
  const { t } = useTranslation();
  return useMemo(() => ({
    back10: t('media.back_10'),
    close: t('media.close_player'),
    expand: t('media.expand_player'),
    forward10: t('media.forward_10'),
    fullscreen: t('media.fullscreen'),
    mute: t('media.mute'),
    next: t('media.next'),
    pause: t('media.pause'),
    play: t('media.play'),
    previous: t('media.previous'),
    toggle: t('media.toggle_controls'),
    unmute: t('media.unmute'),
  }), [t]);
};

const RoundButton = ({ icon, label, onPress, size = 22, style }) => (
  <Pressable accessibilityLabel={label} accessibilityRole="button" hitSlop={8} onPress={onPress} style={[styles.round, style]}>
    <Icon color="#ffffff" name={icon} size={size} />
  </Pressable>
);

/** Controls of the small floating video player: previous, play/pause, next, close and expand. */
export const MiniVideoControls = ({ hasNext, inQueue, labels, onClose, onExpand, onNext, onPlayPause, onPrevious, onSeekBy, onToggle, playing, progress, visible }) => (
  <View style={StyleSheet.absoluteFill}>
    <Pressable accessibilityLabel={labels.toggle} onPress={onToggle} style={StyleSheet.absoluteFill} />
    {visible ? (
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.scrim]}>
        <View pointerEvents="box-none" style={styles.topRow}>
          <RoundButton icon="arrow-expand-all" label={labels.expand} onPress={onExpand} size={18} />
          <RoundButton icon="close" label={labels.close} onPress={onClose} size={20} />
        </View>
        <View pointerEvents="box-none" style={styles.centerRow}>
          {inQueue ? (
            <RoundButton icon="skip-previous" label={labels.previous} onPress={onPrevious} size={24} />
          ) : <RoundButton icon="rewind-10" label={labels.back10} onPress={() => onSeekBy(-10)} size={22} />}
          <RoundButton icon={playing ? 'pause' : 'play'} label={playing ? labels.pause : labels.play} onPress={onPlayPause} size={30} style={styles.main} />
          {inQueue ? (
            <RoundButton icon="skip-next" label={labels.next} onPress={onNext} size={24} style={!hasNext && styles.disabled} />
          ) : <RoundButton icon="fast-forward-10" label={labels.forward10} onPress={() => onSeekBy(10)} size={22} />}
        </View>
      </View>
    ) : null}
    <View pointerEvents="none" style={styles.miniTrack}>
      <View style={[styles.miniValue, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  </View>
);

/** Controls of the main video player: play/pause, ±10 s, seek bar, working mute and fullscreen. */
export const PlayerVideoControls = ({ currentTime, duration, labels, muted, onClose, onFullscreen, onPlayPause, onSeek, onSeekBy, onToggle, onToggleMute, onTouch, playing, title, visible }) => (
  <View style={StyleSheet.absoluteFill}>
    <Pressable accessibilityLabel={labels.toggle} onPress={onToggle} style={StyleSheet.absoluteFill} />
    {visible ? (
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.scrim, styles.playerLayout]}>
        {onClose ? (
          <View pointerEvents="box-none" style={styles.fullscreenTop}>
            <RoundButton icon="close" label={labels.close} onPress={onClose} size={26} style={styles.closeButton} />
            {title ? <Text numberOfLines={1} style={styles.fullscreenTitle}>{title}</Text> : null}
          </View>
        ) : null}
        <View pointerEvents="box-none" style={styles.playerCenter}>
          <RoundButton icon="rewind-10" label={labels.back10} onPress={() => { onTouch(); onSeekBy(-10); }} size={28} />
          <RoundButton icon={playing ? 'pause' : 'play'} label={playing ? labels.pause : labels.play} onPress={() => { onTouch(); onPlayPause(); }} size={38} style={styles.playerMain} />
          <RoundButton icon="fast-forward-10" label={labels.forward10} onPress={() => { onTouch(); onSeekBy(10); }} size={28} />
        </View>
        <View pointerEvents="box-none" style={styles.playerBottom}>
          <Text style={styles.time}>{formatDuration(currentTime) || '0:00'}</Text>
          <Slider
            maximumTrackTintColor="rgba(255,255,255,0.35)"
            maximumValue={duration || 1}
            minimumTrackTintColor="#ffffff"
            minimumValue={0}
            onSlidingComplete={value => { onTouch(); onSeek(value); }}
            style={styles.slider}
            thumbTintColor="#ffffff"
            value={currentTime}
          />
          <Text style={styles.time}>{formatDuration(duration) || '0:00'}</Text>
          <RoundButton icon={muted ? 'volume-off' : 'volume-high'} label={muted ? labels.unmute : labels.mute} onPress={() => { onTouch(); onToggleMute(); }} size={22} />
          {onFullscreen ? <RoundButton icon="fullscreen" label={labels.fullscreen} onPress={() => { onTouch(); onFullscreen(); }} size={24} /> : null}
        </View>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  closeButton: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 22, height: 44, width: 44 },
  fullscreenTitle: { color: '#ffffff', flex: 1, fontSize: 15, fontWeight: '800', marginLeft: 12 },
  fullscreenTop: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  centerRow: { alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  main: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 24, height: 48, marginHorizontal: 10, width: 48 },
  miniTrack: { backgroundColor: 'rgba(255,255,255,0.25)', bottom: 0, height: 3, left: 0, position: 'absolute', right: 0 },
  miniValue: { backgroundColor: '#ffffff', height: '100%' },
  playerBottom: { alignItems: 'center', flexDirection: 'row', paddingBottom: 6, paddingHorizontal: 8 },
  playerCenter: { alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'center' },
  playerLayout: { justifyContent: 'space-between' },
  playerMain: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 32, height: 64, marginHorizontal: 22, width: 64 },
  round: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  scrim: { backgroundColor: SCRIM },
  slider: { flex: 1, height: 32, marginHorizontal: 4 },
  time: { color: '#ffffff', fontSize: 11, fontVariant: ['tabular-nums'], fontWeight: '700', minWidth: 34, textAlign: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 4 },
});
