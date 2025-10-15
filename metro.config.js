const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

module.exports = config;
