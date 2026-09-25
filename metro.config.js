const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .db files to be bundled as assets (for books.db seed)
config.resolver.assetExts.push('db');

module.exports = config;
