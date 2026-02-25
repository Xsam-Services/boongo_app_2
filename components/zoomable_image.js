/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

const { width } = Dimensions.get('window'); // largeur de l'écran

const ZoomableImage = ({ source, realWidth, realHeight }) => {
  // Calcul du ratio largeur/hauteur
  const aspectRatio = realWidth / realHeight;

  // Calcul de la hauteur proportionnelle à la largeur de l'écran
  const imageHeight = width / aspectRatio;

  // Pour le zoom, tu peux utiliser une valeur animée
  const [scale, setScale] = useState(new Animated.Value(1));

  const handlePinchZoom = (event) => {
    const scaleValue = event.nativeEvent.scale; // obtenir le facteur de zoom
    setScale(new Animated.Value(scaleValue));
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => setScale(new Animated.Value(1))}>
        <View style={styles.imageContainer}>
          <Animated.Image
            source={source}
            style={[styles.image, { width, height: imageHeight, transform: [{ scale }] }]}
            resizeMode="contain"
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  imageContainer: {
    width,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
