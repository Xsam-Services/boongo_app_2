/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import HeaderComponent from './header';
import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import useColors from '../hooks/useColors';
import SoundPlayer from '../components/sound_player';

const AudioScreen = ({ route }) => {
  const COLORS = useColors();
  const { prepareAudio } = useMediaPlayback();
  const { audioId, audioTitle, audioAuthor, audioUrl, mediaCover } = route.params;
  const media = useMemo(() => ({
    artwork: mediaCover,
    artist: audioAuthor,
    id: audioId || audioUrl,
    title: audioTitle,
    uri: audioUrl,
  }), [audioAuthor, audioId, audioTitle, audioUrl, mediaCover]);

  useEffect(() => {
    prepareAudio(media);
  }, [media, prepareAudio]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={{ backgroundColor: COLORS.white }}>
        <HeaderComponent title="Audio" />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.artCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {mediaCover ? <Image source={{ uri: mediaCover }} style={[styles.artwork, styles.editorialSurface]} resizeMode="contain" /> : (
            <View style={[styles.artwork, styles.artworkFallback, { backgroundColor: COLORS.light_primary }]}><Icon name="music-note" size={62} color={COLORS.primary} /></View>
          )}
          <Text style={[styles.title, { color: COLORS.black }]} numberOfLines={2}>{audioTitle}</Text>
          {audioAuthor ? <Text style={[styles.author, { color: COLORS.dark }]} numberOfLines={1}>{audioAuthor}</Text> : null}
        </View>
        <View style={[styles.playerCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <SoundPlayer audioId={audioId} audioUrl={audioUrl} title={audioTitle} artist={audioAuthor} artwork={mediaCover} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  artCard: { alignItems: 'center', borderRadius: 24, borderWidth: 1, padding: 22 },
  artwork: { borderRadius: 20, height: 230, width: 230 },
  editorialSurface: { backgroundColor: '#ffffff' },
  artworkFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 29, marginTop: 18, textAlign: 'center' },
  author: { fontSize: 14, marginTop: 5, textAlign: 'center' },
  playerCard: { borderRadius: 20, borderWidth: 1, marginTop: 14, overflow: 'hidden' },
});

export default AudioScreen;
