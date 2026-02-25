/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import { View, Alert, Button, Dimensions, ScrollView, Image, Text } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import getVideoId from 'get-video-id';
import Video from 'react-native-video';
import ImageZoom from 'react-native-image-pan-zoom';
import { PADDING, TEXT_SIZE } from '../tools/constants';
import HeaderComponent from './header';
import useColors from '../hooks/useColors';

const VideoPlayerScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();

  // =============== Get parameters ===============
  const { videoTitle, videoUri } = route.params;
  const video_uri = JSON.stringify(videoUri);
  const { width } = Dimensions.get('window'); // The screen width

  // =============== Get data ===============
  const [playing, setPlaying] = useState(false);
  const [imageHeight, setImageHeight] = useState(0); // Status for image height
  const [hasError, setHasError] = useState(false); // Error loading image
  const { id } = getVideoId(video_uri);

  // =============== Some functions ===============
  const isVideoFile = (url) => {
    if (!url) return false;

    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

  // Retrieve the dimensions of the image to calculate its height based on the width
  const fetchImageDimensions = (uri) => {
    // Use Image.getSize to get the image dimensions
    Image.getSize(uri, (imgWidth, imgHeight) => {
      const aspectRatio = imgWidth / imgHeight; // Calculation of the image ratio
      const calculatedHeight = (width * imgHeight) / imgWidth; // Height proportional to width

      setImageHeight(calculatedHeight); // Update image height
    });
  };

  const handleImageError = () => {
    setHasError(true); // When the image fails to load
  };

  const renderVideoContent = () => {
    if (videoUri.includes('youtube.com') || videoUri.includes('youtu.be')) {
      // If it's a YouTube video
      return (
        <>
          <YoutubePlayer
            height={((Dimensions.get('window').width / 16) * 9) + 1}
            play={playing}
            videoId={id}
            onChangeState={onStateChange}
          />
          <Button title={playing ? 'pause' : 'play'} onPress={togglePlaying} />
        </>
      );
    } else {
      // If it's an external image or video
      if (isVideoFile(videoUri)) {
        return (
          <Video
            source={{ uri: videoUri }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            controls
          />
        );
      } else {
        // If it is an image
        fetchImageDimensions(videoUri); // Retrieve the image dimensions

        // When the height is calculated, it is used for the image
        return imageHeight > 0 && !hasError ? (
          <ImageZoom
            cropWidth={width}
            cropHeight={imageHeight}
            imageWidth={width}
            imageHeight={imageHeight}
            style={{ width: '100%', height: imageHeight }}
          >
            <Image
              source={{ uri: videoUri }}
              style={{ width: '100%', height: imageHeight }}
              onError={handleImageError}
              resizeMode="contain" // "contain" pour garder l'image proportionnelle
            />
          </ImageZoom>
        ) : (
          // Si la hauteur n'est pas encore disponible, afficher un loader
          <View style={{ justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Text>{hasError ? t('error_message.image_not_loaded') : t('loading')}</Text>
          </View>
        );
      }
    }
  };

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert(t('video_ended'));
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
    console.log(id);
  }, []);

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50, backgroundColor: COLORS.white }}>
        <View style={{ paddingVertical: PADDING.p10, paddingHorizontal: PADDING.p01 }}>
          <Text style={{ fontSize: TEXT_SIZE.title, fontWeight: '400', color: COLORS.black, textAlign: 'center' }}>
            {videoTitle}
          </Text>
        </View>

        {renderVideoContent()}
      </ScrollView>
    </>
  );
};

export default VideoPlayerScreen;
