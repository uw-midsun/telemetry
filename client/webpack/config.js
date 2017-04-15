'use strict'

var path = require('path')

module.exports = {
  entry: {
    app: ['./css/app.scss', './js/app.ts']
  },
  port: 3003,
  html: true,
  browsers: ['last 2 versions', 'ie > 8'],
  assets_url: '/',
  stylelint: './css/**/*.scss',
  assets_path: path.join(__dirname, '../dist/'),
  refresh: ['./index.html'],
  historyApiFallback: false,
  debug: process.env.NODE_ENV === 'development'
}
