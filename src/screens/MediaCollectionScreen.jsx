import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as RNLocalize from 'react-native-localize';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { AuthContext } from '../contexts/AuthContext';
import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import { API } from '../tools/constants';
import { sanitizeImageUri } from '../tools/image_source';
import { buildCollections, formatDuration, pickResumeIndex } from '../utils/mediaCollection';
import useColors from '../hooks/useColors';
import useMediaProgress from '../hooks/useMediaProgress';
import HeaderComponent from './header';

const getLanguage = () => RNLocalize.getLocales()[0]?.languageCode || 'fr';

const MediaCollectionScreen = ({ navigation, route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const { activeMedia, playQueue, status } = useMediaPlayback();
  const { itemId } = route.params;
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWork = useCallback(async () => {
    if (!userInfo?.api_token) return;

    setLoading(true);
    try {
      const [netState, userAgent] = await Promise.all([NetInfo.fetch(), Constants.getWebViewUserAgentAsync()]);
      const response = await axios.get(`${API.boongo_url}/work/${itemId}`, {
        headers: {
          'X-localization': getLanguage(),
          'X-user-id': userInfo.id,
          'X-ip-address': netState.details?.ipAddress || '',
          'X-user-agent': userAgent || '',
          Authorization: `Bearer ${userInfo.api_token}`,
        },
      });
      setWork(response.data?.data || null);
    } catch (error) {
      setWork(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, userInfo?.api_token, userInfo?.id]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  const coverImage = sanitizeImageUri(work?.photo_url || work?.images?.find(image => image.type?.alias === 'image_file')?.file_url || work?.images?.find(image => image.file_url)?.file_url);
  const collections = useMemo(() => buildCollections(work, {
    labels: { audio: t('media.track'), video: t('media.episode') },
    workCover: coverImage,
  }), [coverImage, t, work]);

  const audioProgress = useMediaProgress(collections.audioTracks);
  const videoProgress = useMediaProgress(collections.videoEpisodes);

  const isPrivate = Number(work?.is_public) === 0;
  const hasAccessPass = userInfo.has_valid_subscription || userInfo.has_active_code;
  const hasPaidConsultation = userInfo.valid_consultations?.some(consultation => consultation.id === work?.id);
  // The owner previewing a work being published does not need a subscription to check it.
  const canPlay = Boolean(route.params?.preview || (hasAccessPass && (!isPrivate || hasPaidConsultation)));

  const openDetails = () => navigation.navigate('WorkData', { itemId });
  const isOwner = Boolean(work?.user_id) && Number(work.user_id) === Number(userInfo?.id);
  const manageFiles = () => navigation.navigate('WorkFiles', { manage: true, workId: itemId });

  const playItem = (items, index) => {
    if (!canPlay || !items[index]) return;

    playQueue(items, index);
    const item = items[index];
    if (item.kind === 'video') {
      navigation.navigate('VideoPlayer', { mediaType: 'video', videoCover: item.artwork, videoId: item.id, videoTitle: item.title, videoUri: item.uri });
    } else {
      navigation.navigate('Audio', { audioAuthor: item.artist, audioId: item.id, audioTitle: item.title, audioUrl: item.uri, mediaCover: item.artwork });
    }
  };

  const renderSection = (kind, items, progress) => {
    if (!items.length) return null;

    const isAlbum = kind === 'audio';
    const several = items.length > 1;
    const resume = pickResumeIndex(items, progress);
    return (
      <View key={kind} style={[styles.section, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: COLORS.light_primary }]}>
            <Icon name={isAlbum ? 'album' : 'movie-open-play-outline'} size={22} color={COLORS.primary} />
          </View>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{several ? (isAlbum ? t('media.album') : t('media.series')) : (isAlbum ? t('file.audio') : t('file.video'))}</Text>
            <Text style={[styles.sectionMeta, { color: COLORS.dark }]}>{several ? t(isAlbum ? 'media.tracks_count' : 'media.episodes_count', { count: items.length }) : formatDuration(items[0].duration)}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" disabled={!canPlay} onPress={() => playItem(items, resume.index)} style={[styles.playAll, { backgroundColor: COLORS.primary }, !canPlay && styles.disabled]}>
            <Icon name="play" size={18} color="#ffffff" />
            <Text style={styles.playAllText}>{resume.resuming ? t('media.resume') : (several ? t('media.play_all') : t('media.play'))}</Text>
          </TouchableOpacity>
        </View>
        {items.map((item, index) => {
          const isCurrent = activeMedia?.kind === item.kind && String(activeMedia.id) === item.id;
          const duration = formatDuration(item.duration);
          const entry = progress?.[item.id];
          return (
            <TouchableOpacity key={item.id} accessibilityRole="button" activeOpacity={0.78} disabled={!canPlay} onPress={() => playItem(items, index)} style={[styles.row, { borderColor: COLORS.light_secondary }, isCurrent && { backgroundColor: COLORS.light_primary }, !canPlay && styles.disabled]}>
              {item.artwork ? <Image source={{ uri: item.artwork }} style={styles.thumb} resizeMode="cover" /> : (
                <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: COLORS.light_primary }]}>
                  <Icon name={isAlbum ? 'music-note' : 'play-circle-outline'} size={22} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.rowCopy}>
                <Text numberOfLines={2} style={[styles.rowTitle, { color: isCurrent ? COLORS.primary : COLORS.black }]}>{index + 1}. {item.title}</Text>
                {isCurrent ? <Text style={[styles.rowMeta, { color: COLORS.primary }]}>{t('media.playing')}</Text> : entry?.completed ? (
                  <View style={styles.doneRow}><Icon name="check-circle" size={14} color={COLORS.success} /><Text style={[styles.rowMeta, styles.doneText, { color: COLORS.dark }]}>{t('media.completed')}</Text></View>
                ) : duration ? <Text style={[styles.rowMeta, { color: COLORS.dark }]}>{duration}</Text> : null}
                {!isCurrent && entry && !entry.completed ? (
                  <View style={[styles.rowTrack, { backgroundColor: COLORS.light_secondary }]}><View style={[styles.rowValue, { backgroundColor: COLORS.primary, width: `${Math.round(entry.ratio * 100)}%` }]} /></View>
                ) : null}
              </View>
              <Icon name={isCurrent && status.playing ? 'equalizer' : isAlbum ? 'play-circle-outline' : 'chevron-right'} size={isAlbum ? 26 : 22} color={isCurrent ? COLORS.primary : COLORS.dark} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const owner = work?.author || [work?.user_owner?.firstname, work?.user_owner?.lastname].filter(Boolean).join(' ') || work?.organization_owner?.org_name;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={{ backgroundColor: COLORS.white }}>
        <HeaderComponent title={work?.work_title || t('media.title')} />
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
            {coverImage ? <Image source={{ uri: coverImage }} style={[styles.cover, styles.coverSurface]} resizeMode="contain" /> : (
              <View style={[styles.cover, styles.thumbFallback, { backgroundColor: COLORS.light_primary }]}><Icon name="play-box-multiple-outline" size={54} color={COLORS.primary} /></View>
            )}
            <Text style={[styles.title, { color: COLORS.black }]} numberOfLines={3}>{work?.work_title}</Text>
            {owner ? <Text style={[styles.author, { color: COLORS.dark }]} numberOfLines={1}>{owner}</Text> : null}
            {work?.work_content ? <Text style={[styles.description, { color: COLORS.dark }]} numberOfLines={4}>{work.work_content}</Text> : null}
            <TouchableOpacity accessibilityRole="button" onPress={openDetails} style={[styles.detailsButton, { borderColor: COLORS.primary }]}>
              <Text style={[styles.detailsText, { color: COLORS.primary }]}>{t('media.details')}</Text>
            </TouchableOpacity>
            {isOwner && !route.params?.preview ? (
              <TouchableOpacity accessibilityRole="button" onPress={manageFiles} style={[styles.detailsButton, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
                <Text style={[styles.detailsText, { color: '#ffffff' }]}>{t('work_steps.manage_files')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {!canPlay ? (
            <TouchableOpacity activeOpacity={0.8} onPress={openDetails} style={[styles.locked, { backgroundColor: COLORS.light_primary }]}>
              <Icon name="lock-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.lockedText, { color: COLORS.black }]}>{t('media.locked')}</Text>
            </TouchableOpacity>
          ) : null}
          {renderSection('audio', collections.audioTracks, audioProgress)}
          {renderSection('video', collections.videoEpisodes, videoProgress)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  loader: { marginTop: 40 },
  hero: { alignItems: 'center', borderRadius: 24, borderWidth: 1, padding: 20 },
  cover: { borderRadius: 20, height: 200, width: 200 },
  coverSurface: { backgroundColor: '#ffffff' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 29, marginTop: 16, textAlign: 'center' },
  author: { fontSize: 14, marginTop: 5, textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  detailsButton: { borderRadius: 18, borderWidth: 1, marginTop: 14, paddingHorizontal: 16, paddingVertical: 8 },
  detailsText: { fontSize: 13, fontWeight: '800' },
  locked: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginTop: 14, padding: 14 },
  lockedText: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: 10 },
  section: { borderRadius: 22, borderWidth: 1, marginTop: 14, overflow: 'hidden' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', padding: 14 },
  sectionIcon: { alignItems: 'center', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  sectionCopy: { flex: 1, marginLeft: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionMeta: { fontSize: 12, marginTop: 2 },
  playAll: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 },
  playAllText: { color: '#ffffff', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  row: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  thumb: { borderRadius: 10, height: 48, width: 48 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, marginHorizontal: 12 },
  doneRow: { alignItems: 'center', flexDirection: 'row', marginTop: 2 },
  doneText: { marginLeft: 4, marginTop: 0 },
  rowTrack: { borderRadius: 2, height: 3, marginTop: 6, overflow: 'hidden' },
  rowValue: { height: '100%' },
  rowTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  rowMeta: { fontSize: 12, marginTop: 2 },
  disabled: { opacity: 0.5 },
});

export default MediaCollectionScreen;
