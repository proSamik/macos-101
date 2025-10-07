const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    devtool: isProduction ? false : 'source-map',
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    topLevelAwait: true,
  },
  externals: {
    'module': 'var {}',
    'fs': 'var {}',
    'path': 'var {}', 
    'crypto': 'var {}',
    'os': 'var {}',
    'util': 'var {}',
    'stream': 'var {}',
    'events': 'var {}',
    'buffer': 'var {}',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico|webp)$/,
        type: 'asset/resource',
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/renderer'),
    clean: true,
    publicPath: './',
    globalObject: 'globalThis',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env.ONNX_WEB': JSON.stringify('true'),
      'process.browser': JSON.stringify(true),
      '__dirname': JSON.stringify('/'),
      '__filename': JSON.stringify('/index.js'),
      'process.cwd': () => JSON.stringify('/'),
      'process.platform': JSON.stringify('browser'),
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
      global: 'globalThis',
    }),
    new webpack.NormalModuleReplacementPlugin(/^module$/, function(resource) {
      resource.request = path.resolve(__dirname, 'src/polyfills/module-polyfill.js');
    }),
    new webpack.NormalModuleReplacementPlugin(/^fs$/, function(resource) {
      resource.request = 'data:text/javascript,export default {}';
    }),
    new webpack.NormalModuleReplacementPlugin(/^path$/, function(resource) {
      resource.request = 'data:text/javascript,export default { join: () => "", resolve: () => "", basename: () => "", dirname: () => "", extname: () => "" }';
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.mjs'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    mainFields: ['browser', 'module', 'main'],
    fallback: {
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser.js"),
      "path": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "fs": false,
      "net": false,
      "tls": false,
      "url": false,
      "util": false,
      "assert": false,
      "module": false,
      "child_process": false,
      "worker_threads": false,
      "constants": false,
      "vm": false,
      "events": false,
      "querystring": false,
      "http": false,
      "https": false,
      "zlib": false,
      "string_decoder": false,
    },
  },
  };
};