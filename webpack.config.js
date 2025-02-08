const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add rule for Leaflet images
  config.module.rules.push({
    test: /\.(png|jpe?g|gif)$/i,
    type: 'asset/resource'
  });

  // Add rule for Leaflet CSS
  config.module.rules.push({
    test: /\.css$/i,
    use: ['style-loader', 'css-loader'],
  });

  return config;
}; 