// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add CUBE files to the asset modules
config.resolver.assetExts.push("cube", "CUBE");

module.exports = config;
