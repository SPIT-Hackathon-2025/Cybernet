const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolution for .cjs files
config.resolver.sourceExts.push('cjs');

module.exports = config; 