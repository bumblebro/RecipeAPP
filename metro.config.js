const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

// SVG support
config.transformer = {
  ...config.transformer,
  // babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

// 🔥 IMPORTANT: wrap with Reanimated FIRST
config = wrapWithReanimatedMetroConfig(config);

// 🔥 THEN apply NativeWind LAST
module.exports = withNativeWind(config, {
  input: "./app/global.css",
  // configPath: "./tailwind.config.js",
});
