import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView } from 'expo-video';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import useColors from '../hooks/useColors';

const PersistentMediaPlayer = ({ currentRouteName, onOpen }) => {
  const COLORS = useColors();
  const insets = useSafeAreaInsets();
  const { activeMedia, playPause, seekBy, status, stop, videoPlayer } = useMediaPlayback();

  if (!activeMedia) return null;
  if (activeMedia.kind === 'audio' && currentRouteName === 'Audio') return null;
  if (activeMedia.kind === 'video' && currentRouteName === 'VideoPlayer') return null;

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  if (activeMedia.kind === 'video') {
    return (
      <View style={[styles.videoFloating, { bottom: Math.max(insets.bottom, 12), backgroundColor: COLORS.black }]}>
        <Pressable accessibilityLabel="Ouvrir la vidéo" onPress={() => onOpen(activeMedia)} style={styles.videoSurface}>
          <VideoView
            allowsPictureInPicture
            contentFit="contain"
            nativeControls={false}
            player={videoPlayer}
            startsPictureInPictureAutomatically
            style={styles.video}
          />
        </Pressable>
        <View style={styles.videoActions}>
          <Text numberOfLines={1} style={styles.videoTitle}>{activeMedia.title}</Text>
          <Pressable accessibilityLabel={status.playing ? 'Pause' : 'Lecture'} onPress={playPause} style={styles.videoButton}>
            <Icon color="#ffffff" name={status.playing ? 'pause' : 'play'} size={22} />
          </Pressable>
          <Pressable accessibilityLabel="Fermer le lecteur" onPress={stop} style={styles.videoButton}>
            <Icon color="#ffffff" name="close" size={22} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.audioFloating, { bottom: Math.max(insets.bottom, 12), backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
      <Pressable accessibilityLabel="Ouvrir le livre audio" onPress={() => onOpen(activeMedia)} style={styles.audioDetails}>
        {activeMedia.artwork ? (
          <Image source={{ uri: activeMedia.artwork }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkFallback, { backgroundColor: COLORS.light_primary }]}>
            <Icon color={COLORS.primary} name="book-music-outline" size={24} />
          </View>
        )}
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: COLORS.black }]}>{activeMedia.title}</Text>
          {activeMedia.artist ? <Text numberOfLines={1} style={[styles.artist, { color: COLORS.dark }]}>{activeMedia.artist}</Text> : null}
        </View>
      </Pressable>
      <Pressable accessibilityLabel="Reculer de 10 secondes" onPress={() => seekBy(-10)} style={styles.audioButton}>
        <Icon color={COLORS.dark} name="rewind-10" size={21} />
      </Pressable>
      <Pressable accessibilityLabel={status.playing ? 'Pause' : 'Lecture'} onPress={playPause} style={[styles.playButton, { backgroundColor: COLORS.primary }]}>
        <Icon color="#ffffff" name={status.playing ? 'pause' : 'play'} size={24} />
      </Pressable>
      <Pressable accessibilityLabel="Avancer de 10 secondes" onPress={() => seekBy(10)} style={styles.audioButton}>
        <Icon color={COLORS.dark} name="fast-forward-10" size={21} />
      </Pressable>
      <Pressable accessibilityLabel="Fermer le lecteur" onPress={stop} style={styles.audioButton}>
        <Icon color={COLORS.dark} name="close" size={21} />
      </Pressable>
      <View style={[styles.progressTrack, { backgroundColor: COLORS.light_secondary }]}>
        <View style={[styles.progressValue, { backgroundColor: COLORS.primary, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

export default PersistentMediaPlayer;

const styles = StyleSheet.create({
  artist: { fontSize: 11, marginTop: 2 },
  artwork: { borderRadius: 10, height: 44, width: 44 },
  artworkFallback: { alignItems: 'center', justifyContent: 'center' },
  audioButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 34 },
  audioDetails: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  audioFloating: { alignItems: 'center', borderRadius: 16, borderWidth: 1, elevation: 8, flexDirection: 'row', left: 12, minHeight: 64, padding: 9, position: 'absolute', right: 12, shadowColor: '#000000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.2, shadowRadius: 7, zIndex: 100 },
  copy: { flex: 1, marginLeft: 9 },
  playButton: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  progressTrack: { bottom: 0, height: 3, left: 12, overflow: 'hidden', position: 'absolute', right: 12 },
  progressValue: { height: '100%' },
  title: { fontSize: 13, fontWeight: '800' },
  video: { height: '100%', width: '100%' },
  videoActions: { alignItems: 'center', flexDirection: 'row', minHeight: 42, paddingHorizontal: 8 },
  videoButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  videoFloating: { borderRadius: 16, elevation: 9, overflow: 'hidden', position: 'absolute', right: 12, shadowColor: '#000000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8, width: 230, zIndex: 100 },
  videoSurface: { aspectRatio: 16 / 9, width: '100%' },
  videoTitle: { color: '#ffffff', flex: 1, fontSize: 12, fontWeight: '700' },
});
