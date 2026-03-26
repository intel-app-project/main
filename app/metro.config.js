const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure we resolve .ts and .tsx files correctly
config.resolver.sourceExts.push('ts', 'tsx', 'svg');
config.resolver.resolverMainFields = ['sbmodern', 'browser', 'main'];

module.exports = config;
