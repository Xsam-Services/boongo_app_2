/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import getVideoId from 'get-video-id';
import Video from 'react-native-video';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import HeaderComponent from './header';
import useColors from '../hooks/useColors';

const isVideoFile = url => ['.mp4', '.mov', '.avi', '.webm', '.mkv'].some(extension => url?.toLowerCase().includes(extension));

const VideoPlayerScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { videoTitle, videoUri } = route.params;
  const { width } = Dimensions.get('window');
  const [playing, setPlaying] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const [imageError, setImageError] = useState(false);
  const youtubeId = getVideoId(videoUri || '').id;
  const isYoutube = Boolean(youtubeId) && (videoUri?.includes('youtube.com') || videoUri?.includes('youtu.be'));
  const isVideo = isYoutube || isVideoFile(videoUri);

  const onYoutubeStateChange = useCallback(state => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert(t('video_ended'));
    }
  }, [t]);

  const imageHeight = imageSize ? Math.max(260, (width * imageSize.height) / imageSize.width) : 300;

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
            <YoutubePlayer height={((width - 32) / 16) * 9} play={playing} videoId={youtubeId} onChangeState={onYoutubeStateChange} />
          ) : isVideo ? (
            <Video source={{ uri: videoUri }} style={styles.video} controls resizeMode="contain" />
          ) : imageError ? (
            <View style={styles.placeholder}><Icon name="image-broken-variant" size={36} color="#ffffff" /><Text style={styles.placeholderText}>{t('error_message.image_not_loaded')}</Text></View>
          ) : (
            <ImageZoom cropWidth={width - 32} cropHeight={imageHeight} imageWidth={width - 32} imageHeight={imageHeight}>
              <Image source={{ uri: videoUri }} style={{ height: imageHeight, width: width - 32 }} resizeMode="contain" onLoad={({ nativeEvent }) => setImageSize(nativeEvent.source)} onError={() => setImageError(true)} />
            </ImageZoom>
          )}
        </View>
        {!isVideo && !imageError && !imageSize ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
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
  video: { aspectRatio: 16 / 9, width: '100%' },
  placeholder: { alignItems: 'center', aspectRatio: 16 / 9, justifyContent: 'center', width: '100%' },
  placeholderText: { color: '#ffffff', fontSize: 14, marginTop: 10 },
  loader: { marginTop: 16 },
  hint: { fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
});

export default VideoPlayerScreen;
