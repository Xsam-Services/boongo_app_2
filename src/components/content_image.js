import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { toImageSource } from '../tools/image_source';

const ContentImage = ({ source, style, ...imageProps }) => {
  const safeSource = toImageSource(source);
  if (!safeSource) return null;

  return (
    <View style={[styles.frame, style]}>
      <Image source={safeSource} style={styles.backdrop} resizeMode="cover" blurRadius={22} />
      <View style={styles.backdropTint} />
      <Image source={safeSource} style={styles.image} resizeMode="contain" {...imageProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', position: 'relative' },
  backdrop: { height: '100%', left: 0, opacity: 0.8, position: 'absolute', top: 0, width: '100%' },
  backdropTint: { backgroundColor: 'rgba(0, 0, 0, 0.18)', height: '100%', left: 0, position: 'absolute', top: 0, width: '100%', zIndex: 1 },
  image: { height: '100%', width: '100%', zIndex: 2 },
});

export default ContentImage;
