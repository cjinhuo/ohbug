'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/ohbug-vue.umd.prod.js')
} else {
  module.exports = require('./dist/ohbug-vue.umd.js')
}
