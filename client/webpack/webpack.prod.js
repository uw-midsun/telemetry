'use strict'

const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const AssetsPlugin = require('assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const webpack_base = require('./webpack.base')
const config = require('./config')

webpack_base.plugins.push(
  new ProgressBarPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    comments: false
  }),
  new AssetsPlugin({
    filename: path.join('dist', 'assets.json')
  }),
  new CopyWebpackPlugin([
    {
      from: 'img',
      to: 'img'
    },
    {
      from: 'fonts',
      to: 'fonts'
    }
  ])
);

module.exports = webpack_base;
