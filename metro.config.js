const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve(
    'react-native-svg-transformer/expo'
);

config.resolver.assetExts = config.resolver.assetExts.filter(
    ext => ext !== 'svg'
);

config.resolver.sourceExts.push('svg');

module.exports = mergeConfig(config, {});
