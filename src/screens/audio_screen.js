/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import HeaderComponent from './header';
import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import useColors from '../hooks/useColors';
import useMediaProgress from '../hooks/useMediaProgress';
import { formatDuration } from '../utils/mediaCollection';
import SoundPlayer from '../components/sound_player';

const AudioScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { activeMedia, playQueue, prepareAudio, queue, status } = useMediaPlayback();
  const params = route.params;
  const media = useMemo(() => ({
    artwork: params.mediaCover,
    artist: params.audioAuthor,
    id: params.audioId || params.audioUrl,
    title: params.audioTitle,
    uri: params.audioUrl,
  }), [params.audioAuthor, params.audioId, params.audioTitle, params.audioUrl, params.mediaCover]);
  const current = queue.length > 1 && activeMedia?.kind === 'audio' ? activeMedia : media;
  const audioId = current.id;
  const audioTitle = current.title;
  const audioAuthor = current.artist;
  const audioUrl = current.uri;
  const mediaCover = current.artwork;
  const tracks = queue.length > 1 && activeMedia?.kind === 'audio' ? queue : [];
  const progress = useMediaProgress(tracks);

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
        {tracks.length ? (
          <View style={[styles.list, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
            <View style={styles.listHeader}>
              <Icon name="playlist-music" size={22} color={COLORS.primary} />
              <Text style={[styles.listTitle, { color: COLORS.black }]}>{t('media.album')} · {t('media.tracks_count', { count: tracks.length })}</Text>
            </View>
            {tracks.map((track, index) => {
              const isCurrent = String(activeMedia?.id) === String(track.id);
              const entry = progress[track.id];
              const duration = formatDuration(track.duration);
              return (
                <TouchableOpacity key={track.id} accessibilityRole="button" accessibilityState={{ selected: isCurrent }} activeOpacity={0.78} onPress={() => !isCurrent && playQueue(tracks, index)} style={[styles.track, { borderColor: COLORS.light_secondary }, isCurrent && { backgroundColor: COLORS.light_primary }]}>
                  <Text style={[styles.trackIndex, { color: isCurrent ? COLORS.primary : COLORS.dark }]}>{index + 1}</Text>
                  <View style={styles.trackCopy}>
                    <Text numberOfLines={1} style={[styles.trackTitle, { color: isCurrent ? COLORS.primary : COLORS.black }]}>{track.title}</Text>
                    {isCurrent ? <Text style={[styles.trackMeta, { color: COLORS.primary }]}>{t('media.playing')}</Text> : entry?.completed ? (
                      <Text style={[styles.trackMeta, { color: COLORS.dark }]}>{t('media.completed')}{duration ? ` · ${duration}` : ''}</Text>
                    ) : duration ? <Text style={[styles.trackMeta, { color: COLORS.dark }]}>{duration}</Text> : null}
                  </View>
                  <Icon name={isCurrent ? (status.playing ? 'equalizer' : 'pause-circle-outline') : entry?.completed ? 'check-circle' : 'play-circle-outline'} size={24} color={isCurrent ? COLORS.primary : entry?.completed ? COLORS.success : COLORS.dark} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
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
  list: { borderRadius: 20, borderWidth: 1, marginTop: 14, overflow: 'hidden' },
  listHeader: { alignItems: 'center', flexDirection: 'row', padding: 14 },
  listTitle: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
  track: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12 },
  trackIndex: { fontSize: 13, fontWeight: '800', textAlign: 'center', width: 24 },
  trackCopy: { flex: 1, marginHorizontal: 10 },
  trackTitle: { fontSize: 14, fontWeight: '700' },
  trackMeta: { fontSize: 12, marginTop: 2 },
});

export default AudioScreen;
