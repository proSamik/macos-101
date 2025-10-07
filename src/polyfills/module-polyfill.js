// Module polyfill for browser environment
export default {
  exports: {},
  require: function() { return {}; },
  filename: '/index.js',
  dirname: '/',
  loaded: true,
  parent: null,
  children: []
};

// CommonJS compatibility
if (typeof module !== 'undefined') {
  module.exports = {};
}