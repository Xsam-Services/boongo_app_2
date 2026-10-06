/**
 * @author Vander Otis
 * @see https://github.com/vanotis720
 */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import useColors from '../hooks/useColors';
import { getMediaIdentity } from '../utils/mediaProgress';

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const SoundPlayer = ({ audioId, audioUrl, artwork, artist, title }) => {
  const COLORS = useColors();
  const { activeMedia, playAudio, playPause, seekBy, seekTo, status } = useMediaPlayback();
  const media = useMemo(() => ({ id: audioId || audioUrl, uri: audioUrl, title, artist, artwork }), [artist, artwork, audioId, audioUrl, title]);
  const isActive = activeMedia?.kind === 'audio' && getMediaIdentity(activeMedia) === getMediaIdentity(media);
  const position = isActive ? status.currentTime || 0 : 0;
  const duration = isActive ? status.duration || 0 : 0;
  const isPlaying = isActive && status.playing;

  const togglePlayback = () => {
    if (isActive) playPause();
    else playAudio(media);
  };

  return (
    <View style={styles.container}>
      <View style={styles.transport}>
        <Pressable accessibilityLabel="Reculer de 10 secondes" disabled={!isActive} onPress={() => seekBy(-10)} style={[styles.secondaryButton, !isActive && styles.disabledButton, { backgroundColor: COLORS.light_secondary }]}>
          <Icon name="rewind-10" size={23} color={COLORS.dark} />
        </Pressable>
        <Pressable accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'} onPress={togglePlayback} style={[styles.playButton, { backgroundColor: COLORS.primary }]}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={31} color="#ffffff" />
        </Pressable>
        <Pressable accessibilityLabel="Avancer de 10 secondes" disabled={!isActive} onPress={() => seekBy(10)} style={[styles.secondaryButton, !isActive && styles.disabledButton, { backgroundColor: COLORS.light_secondary }]}>
          <Icon name="fast-forward-10" size={23} color={COLORS.dark} />
        </Pressable>
      </View>
      <Slider
        disabled={!duration}
        value={position}
        minimumValue={0}
        maximumValue={duration || 1}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.dark_light}
        thumbTintColor={COLORS.primary}
        onSlidingComplete={seekTo}
        style={styles.slider}
      />
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: COLORS.dark }]}>{formatDuration(position)}</Text>
        <Text style={[styles.time, { color: COLORS.dark }]}>{formatDuration(duration)}</Text>
      </View>
    </View>
  );
};

export default SoundPlayer;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingVertical: 18 },
  disabledButton: { opacity: 0.45 },
  playButton: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  secondaryButton: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  slider: { height: 32, marginTop: 14, width: '100%' },
  time: { fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  transport: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
});
