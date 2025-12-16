module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@': './',
          '@/FamilyViewUI': './FamilyViewUI',
          '@/components': './components',
          '@/assets': './assets',
        }
      }],
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin'
    ]
  };
}