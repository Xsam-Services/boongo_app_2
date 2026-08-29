/**
 * @author Vander Otis
 * @see https://github.com/vanotis720
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import useColors from '../hooks/useColors';

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const SoundPlayer = ({ audioUrl, artwork, artist, title }) => {
  const COLORS = useColors();
  const player = useAudioPlayer({ uri: decodeURIComponent(audioUrl), name: title, artist, artwork });
  const status = useAudioPlayerStatus(player);
  const position = status.currentTime || 0;
  const duration = status.duration || 0;

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.error('Failed to configure audio mode:', error);
      }
    };

    configureAudio();
  }, []);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekBy = (seconds) => {
    player.seekTo(Math.max(0, Math.min(duration, position + seconds)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.transport}>
        <Pressable accessibilityLabel="Reculer de 10 secondes" onPress={() => seekBy(-10)} style={[styles.secondaryButton, { backgroundColor: COLORS.light_secondary }]}>
          <Icon name="rewind-10" size={23} color={COLORS.dark} />
        </Pressable>
        <Pressable accessibilityLabel={status.playing ? 'Pause' : 'Lecture'} onPress={togglePlayback} style={[styles.playButton, { backgroundColor: COLORS.primary }]}>
          <Icon name={status.playing ? 'pause' : 'play'} size={31} color="#ffffff" />
        </Pressable>
        <Pressable accessibilityLabel="Avancer de 10 secondes" onPress={() => seekBy(10)} style={[styles.secondaryButton, { backgroundColor: COLORS.light_secondary }]}>
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
        onSlidingComplete={(value) => player.seekTo(value)}
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
  playButton: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  secondaryButton: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  slider: { height: 32, marginTop: 14, width: '100%' },
  time: { fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  transport: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28 },
});
