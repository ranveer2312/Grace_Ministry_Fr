module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // You can add other plugins here if needed,
      // but no Reanimated plugin is required.
    ],
  };
};
