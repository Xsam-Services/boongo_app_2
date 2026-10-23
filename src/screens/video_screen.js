/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import getVideoId from 'get-video-id';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import HeaderComponent from './header';
import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import { formatDuration, isVideoFile } from '../utils/mediaCollection';
import { PlayerVideoControls, useControlLabels, useControlsVisibility } from '../components/video_controls';
import VideoFullscreen from '../components/video_fullscreen';
import { lockLandscape, lockPortrait } from '../utils/orientation';
import useMediaProgress from '../hooks/useMediaProgress';
import useColors from '../hooks/useColors';

const VideoPlayerScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { activeMedia, hasNext, hasPrevious, next, pause, playPause, playQueue, playVideo, previous, queue, queueIndex, seekBy, seekTo, status, videoPlayer } = useMediaPlayback();
  const { mediaType, videoCover, videoId, videoTitle: routeVideoTitle, videoUri } = route.params;
  const { width } = Dimensions.get('window');
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(Boolean(videoPlayer.muted));
  const labels = useControlLabels();
  const controls = useControlsVisibility(status.playing);
  const queueProgress = useMediaProgress(queue);
  const [imageSize, setImageSize] = useState(null);
  const [imageError, setImageError] = useState(false);
  const youtubeId = getVideoId(videoUri || '').id || videoUri?.match(/(?:embed\/|v=|youtu\.be\/)([^?&/]+)/)?.[1];
  const isYoutube = Boolean(youtubeId) && (videoUri?.includes('youtube.com') || videoUri?.includes('youtu.be'));
  const isVideo = mediaType === 'video' || isYoutube || isVideoFile(videoUri);
  const [youtubeState, setYoutubeState] = useState(isYoutube ? 'loading' : 'ready');
  const [videoKey, setVideoKey] = useState(0);
  const media = useMemo(() => ({
    artwork: videoCover,
    id: videoId || videoUri,
    title: routeVideoTitle,
    uri: videoUri,
  }), [routeVideoTitle, videoCover, videoId, videoUri]);
  const inQueue = queue.length > 1 && activeMedia?.kind === 'video';
  const videoTitle = inQueue ? activeMedia.title : routeVideoTitle;
  const isActiveVideo = activeMedia?.kind === 'video' && (inQueue || activeMedia.id === String(media.id));
  const nativeVideoState = isActiveVideo && status.error ? 'error' : isActiveVideo && status.isLoaded ? 'ready' : 'loading';

  useEffect(() => {
    if (isVideo && !isYoutube) playVideo(media);
  }, [isVideo, isYoutube, media, playVideo]);

  useFocusEffect(useCallback(() => () => {
    setYoutubePlaying(false);
  }, []));

  const onYoutubeStateChange = useCallback(state => {
    if (state === 'playing') pause();
    if (state === 'ended') {
      setYoutubePlaying(false);
      Alert.alert(t('video_ended'));
    }
  }, [pause, t]);

  const imageHeight = imageSize ? Math.max(260, (width * imageSize.height) / imageSize.width) : 300;

  useEffect(() => {
    if (!isYoutube || youtubeState !== 'loading') return undefined;
    const timeout = setTimeout(() => setYoutubeState('error'), 12000);
    return () => clearTimeout(timeout);
  }, [isYoutube, videoKey, youtubeState, videoUri]);

  useEffect(() => {
    setMuted(Boolean(videoPlayer.muted));
    const subscription = videoPlayer.addListener('volumeChange', ({ isMuted }) => setMuted(Boolean(isMuted)));
    return () => subscription.remove();
  }, [videoPlayer]);

  // The app stays in portrait: landscape is only for the full-screen player, and leaving this screen
  // while it is open must also restore portrait.
  useEffect(() => () => { lockPortrait(); }, []);

  const openFullscreen = async () => {
    await lockLandscape();
    setFullscreen(true);
  };

  const closeFullscreen = async () => {
    setFullscreen(false);
    await lockPortrait();
  };

  const toggleMute = () => {
    videoPlayer.muted = !videoPlayer.muted;
    setMuted(Boolean(videoPlayer.muted));
  };

  const retryVideo = () => {
    if (isYoutube) {
      setYoutubeState('loading');
      setVideoKey(currentKey => currentKey + 1);
    } else {
      playVideo(inQueue ? activeMedia : media, true);
    }
  };

  const playerState = isYoutube ? youtubeState : nativeVideoState;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={{ backgroundColor: COLORS.white }}>
        <HeaderComponent title={t('media.title')} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.titleCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <View style={[styles.iconFrame, { backgroundColor: COLORS.light_primary }]}>
            <Icon name={isVideo ? 'play-circle-outline' : 'image-outline'} size={27} color={COLORS.primary} />
          </View>
          <Text style={[styles.title, { color: COLORS.black }]}>{videoTitle}</Text>
        </View>

        <View style={[styles.playerCard, { backgroundColor: COLORS.black }]}>
          {isYoutube ? (
            <View style={styles.videoContainer}>
              <YoutubePlayer
                key={videoKey}
                height={((width - 32) / 16) * 9}
                play={youtubePlaying}
                videoId={youtubeId}
                onReady={() => setYoutubeState('ready')}
                onError={() => setYoutubeState('error')}
                onChangeState={onYoutubeStateChange}
              />
              {youtubeState === 'ready' ? (
                <TouchableOpacity accessibilityLabel={youtubePlaying ? 'Pause' : 'Lecture'} onPress={() => setYoutubePlaying(value => !value)} style={styles.youtubeControl}>
                  <Icon name={youtubePlaying ? 'pause' : 'play'} size={24} color="#ffffff" />
                </TouchableOpacity>
              ) : null}
              {playerState === 'loading' ? <View style={styles.videoOverlay}><ActivityIndicator color="#ffffff" /><Text style={styles.videoOverlayText}>{t('loading')}</Text></View> : null}
              {playerState === 'error' ? <View style={styles.videoOverlay}><Icon name="video-off-outline" size={38} color="#ffffff" /><Text style={styles.videoOverlayText}>{t('media.unavailable')}</Text><TouchableOpacity style={styles.retryButton} onPress={retryVideo}><Icon name="refresh" size={17} color="#ffffff" /><Text style={styles.retryText}>{t('media.retry')}</Text></TouchableOpacity></View> : null}
            </View>
          ) : isVideo ? (
            <View style={styles.videoContainer}>
              {isActiveVideo ? (
                !fullscreen ? (
                  <VideoView
                    allowsPictureInPicture
                    contentFit="contain"
                    fullscreenOptions={{ enable: false }}
                    nativeControls={false}
                    player={videoPlayer}
                    startsPictureInPictureAutomatically
                    style={styles.video}
                  />
                ) : <View style={styles.video} />
              ) : null}
              {isActiveVideo && playerState === 'ready' && !fullscreen ? (
                <PlayerVideoControls
                  currentTime={status.currentTime}
                  duration={status.duration}
                  labels={labels}
                  muted={muted}
                  onFullscreen={openFullscreen}
                  onPlayPause={playPause}
                  onSeek={seekTo}
                  onSeekBy={seekBy}
                  onToggle={controls.toggle}
                  onToggleMute={toggleMute}
                  onTouch={controls.touch}
                  playing={status.playing}
                  visible={controls.visible}
                />
              ) : null}
              {playerState === 'loading' ? <View style={styles.videoOverlay}><ActivityIndicator color="#ffffff" /><Text style={styles.videoOverlayText}>{t('loading')}</Text></View> : null}
              {playerState === 'error' ? <View style={styles.videoOverlay}><Icon name="video-off-outline" size={38} color="#ffffff" /><Text style={styles.videoOverlayText}>{t('media.unavailable')}</Text><TouchableOpacity style={styles.retryButton} onPress={retryVideo}><Icon name="refresh" size={17} color="#ffffff" /><Text style={styles.retryText}>{t('media.retry')}</Text></TouchableOpacity></View> : null}
            </View>
          ) : imageError ? (
            <View style={styles.placeholder}><Icon name="image-broken-variant" size={36} color="#ffffff" /><Text style={styles.placeholderText}>{t('error_message.image_not_loaded')}</Text></View>
          ) : (
            <ImageZoom cropWidth={width - 32} cropHeight={imageHeight} imageWidth={width - 32} imageHeight={imageHeight}>
              <Image source={{ uri: videoUri }} style={{ height: imageHeight, width: width - 32 }} resizeMode="contain" onLoad={({ nativeEvent }) => setImageSize(nativeEvent.source)} onError={() => setImageError(true)} />
            </ImageZoom>
          )}
        </View>
        {!isVideo && !imageError && !imageSize ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
        {inQueue ? (
          <View style={styles.episodeNav}>
            <TouchableOpacity accessibilityRole="button" disabled={!hasPrevious} onPress={previous} style={[styles.episodeButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
              <Icon name="skip-previous" size={22} color={COLORS.dark} />
              <Text style={[styles.episodeButtonText, { color: COLORS.black }]}>{t('media.previous')}</Text>
            </TouchableOpacity>
            <Text style={[styles.episodePosition, { color: COLORS.dark }]}>{t('media.position', { current: queueIndex + 1, total: queue.length })}</Text>
            <TouchableOpacity accessibilityRole="button" disabled={!hasNext} onPress={next} style={[styles.episodeButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }, !hasNext && styles.episodeButtonDisabled]}>
              <Text style={[styles.episodeButtonText, { color: COLORS.black }]}>{t('media.next_episode')}</Text>
              <Icon name="skip-next" size={22} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        ) : null}
        {inQueue ? (
          <View style={[styles.playlist, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
            <View style={styles.playlistHeader}>
              <Icon name="playlist-play" size={22} color={COLORS.primary} />
              <Text style={[styles.playlistTitle, { color: COLORS.black }]}>{t('media.series')} · {t('media.episodes_count', { count: queue.length })}</Text>
            </View>
            {queue.map((episode, index) => {
              const isCurrent = index === queueIndex;
              const duration = formatDuration(episode.duration);
              const entry = queueProgress[episode.id];
              return (
                <TouchableOpacity key={episode.id} accessibilityRole="button" accessibilityState={{ selected: isCurrent }} activeOpacity={0.78} onPress={() => !isCurrent && playQueue(queue, index)} style={[styles.episodeRow, { borderColor: COLORS.light_secondary }, isCurrent && { backgroundColor: COLORS.light_primary }]}>
                  {episode.artwork ? <Image source={{ uri: episode.artwork }} style={styles.episodeThumb} resizeMode="cover" /> : (
                    <View style={[styles.episodeThumb, styles.episodeThumbFallback, { backgroundColor: COLORS.light_primary }]}><Icon name="play-circle-outline" size={22} color={COLORS.primary} /></View>
                  )}
                  <View style={styles.episodeCopy}>
                    <Text numberOfLines={2} style={[styles.episodeTitle, { color: isCurrent ? COLORS.primary : COLORS.black }]}>{index + 1}. {episode.title}</Text>
                    {isCurrent ? <Text style={[styles.episodeMeta, { color: COLORS.primary }]}>{t('media.playing')}</Text> : entry?.completed ? <Text style={[styles.episodeMeta, { color: COLORS.dark }]}>{t('media.completed')}{duration ? ` · ${duration}` : ''}</Text> : duration ? <Text style={[styles.episodeMeta, { color: COLORS.dark }]}>{duration}</Text> : null}
                    {!isCurrent && entry && !entry.completed ? (
                      <View style={[styles.episodeTrack, { backgroundColor: COLORS.light_secondary }]}><View style={[styles.episodeValue, { backgroundColor: COLORS.primary, width: `${Math.round(entry.ratio * 100)}%` }]} /></View>
                    ) : null}
                  </View>
                  <Icon name={isCurrent ? (status.playing ? 'equalizer' : 'pause-circle-outline') : entry?.completed ? 'check-circle' : 'play-circle-outline'} size={24} color={isCurrent ? COLORS.primary : entry?.completed ? COLORS.success : COLORS.dark} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        <VideoFullscreen
          currentTime={status.currentTime}
          duration={status.duration}
          muted={muted}
          onClose={closeFullscreen}
          onPlayPause={playPause}
          onSeek={seekTo}
          onSeekBy={seekBy}
          onToggleMute={toggleMute}
          player={videoPlayer}
          playing={status.playing}
          title={videoTitle}
          visible={fullscreen}
        />
        <Text style={[styles.hint, { color: COLORS.dark }]}>{isVideo ? t('media.description') : 'Pincez l’image pour zoomer.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  titleCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 14, padding: 14 },
  iconFrame: { alignItems: 'center', borderRadius: 18, height: 44, justifyContent: 'center', width: 44 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', lineHeight: 23, marginLeft: 12 },
  playerCard: { alignItems: 'center', borderRadius: 22, overflow: 'hidden', width: '100%' },
  videoContainer: { aspectRatio: 16 / 9, width: '100%' },
  video: { backgroundColor: '#0d0f14', height: '100%', width: '100%' },
  videoOverlay: { alignItems: 'center', backgroundColor: '#0d0f14', height: '100%', justifyContent: 'center', left: 0, padding: 24, position: 'absolute', top: 0, width: '100%' },
  videoOverlayText: { color: '#ffffff', fontSize: 14, marginTop: 10, textAlign: 'center' },
  retryButton: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 16, flexDirection: 'row', marginTop: 14, minHeight: 38, paddingHorizontal: 13 },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginLeft: 6 },
  placeholder: { alignItems: 'center', aspectRatio: 16 / 9, justifyContent: 'center', width: '100%' },
  placeholderText: { color: '#ffffff', fontSize: 14, marginTop: 10 },
  loader: { marginTop: 16 },
  episodeNav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  episodeButton: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 40, paddingHorizontal: 10 },
  episodeButtonDisabled: { opacity: 0.4 },
  episodeButtonText: { fontSize: 12, fontWeight: '800', marginHorizontal: 4 },
  playlist: { borderRadius: 20, borderWidth: 1, marginTop: 14, overflow: 'hidden' },
  playlistHeader: { alignItems: 'center', flexDirection: 'row', padding: 14 },
  playlistTitle: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
  episodeRow: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  episodeThumb: { borderRadius: 10, height: 48, width: 72 },
  episodeThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  episodeCopy: { flex: 1, marginHorizontal: 12 },
  episodeTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  episodeMeta: { fontSize: 12, marginTop: 2 },
  episodeTrack: { borderRadius: 2, height: 3, marginTop: 6, overflow: 'hidden' },
  episodeValue: { height: '100%' },
  episodePosition: { fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
  youtubeControl: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.72)', borderRadius: 22, bottom: 10, height: 44, justifyContent: 'center', position: 'absolute', right: 10, width: 44 },
});

export default VideoPlayerScreen;
