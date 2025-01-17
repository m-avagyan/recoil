/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @format
 * @oncall recoil
 */
'use strict';

const env = require('./utils/env');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fileSystem = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const WriteFilePlugin = require('write-file-webpack-plugin');

// load the secrets
const alias = {
  'react-dom': '@hot-loader/react-dom',
};

const buildFolder = 'recoil_devtools_ext';

const secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const options = {
  mode: env.NODE_ENV || 'development',
  entry: {
    popup: path.join(__dirname, 'src', 'pages', 'Popup', 'PopupScript.js'),
    devtools: path.join(
      __dirname,
      'src',
      'pages',
      'Devtools',
      'DevtoolsScript.js',
    ),
    background: path.join(
      __dirname,
      'src',
      'pages',
      'Background',
      'Background.js',
    ),
    contentScript: path.join(
      __dirname,
      'src',
      'pages',
      'Content',
      'ContentScript.js',
    ),
    pageScript: path.join(__dirname, 'src', 'pages', 'Page', 'PageScript.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['contentScript'],
  },
  output: {
    path: path.resolve(__dirname, buildFolder),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias,
    extensions: fileExtensions
      .map(extension => '.' + extension)
      .concat(['.jsx', '.js', '.css']),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      __DEV__: env.NODE_ENV !== 'production',
    }),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'assets', 'img', 'icon-34.png'),
        to: path.join(__dirname, buildFolder),
      },
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'assets', 'img', 'icon-128.png'),
        to: path.join(__dirname, buildFolder),
      },
    ]),
    new CopyWebpackPlugin(
      [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, buildFolder),
          force: true,
          transform(content, _path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              }),
            );
          },
        },
      ],
      {
        logLevel: 'info',
        copyUnmodified: true,
      },
    ),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'Devpanel.html'),
      filename: 'devpanel.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.html'),
      filename: 'devtools.html',
      chunks: ['devtools'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'pages',
        'Background',
        'index.html',
      ),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new WriteFilePlugin(),
  ],
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
