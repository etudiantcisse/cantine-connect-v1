const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Supabase publishes CJS/ESM bundles; allow Metro to resolve these extensions.
config.resolver.sourceExts = Array.from(
	new Set([...config.resolver.sourceExts, "cjs", "mjs"]),
);

module.exports = config;
