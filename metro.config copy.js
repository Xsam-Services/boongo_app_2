const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

// Get Metro Default Configuration
const defaultConfig = getDefaultConfig(__dirname);

// Configuration for transforming SVG files
const svgConfig = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

// Merge Reanimated config with SVG config
const mergedConfig = mergeConfig(defaultConfig, svgConfig);

// Wrap the configuration with the one required by Reanimated
module.exports = wrapWithReanimatedMetroConfig(mergedConfig);
