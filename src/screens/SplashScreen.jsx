/**
 * @author Vander Otis
 * @see https://github.com/vanotis720
 */
import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import useColors from '../hooks/useColors';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const COLORS = useColors();

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <Image
        source={require('../../assets/img/brand-with-name.png')}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.8,
    height: width * 0.8,
    resizeMode: 'contain',
  },
});

export default SplashScreen;