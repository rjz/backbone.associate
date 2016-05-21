/* jshint strict: false */
/* globals window: false */
var requireConfig = {
  baseUrl: '/base',
  deps: [],

  paths: {
    underscore: 'node_modules/underscore/underscore',
    backbone: 'node_modules/backbone/backbone',
    jquery: 'node_modules/jquery/dist/jquery'
  },

  shim: {
    'test/helper': {
      deps: ['src/backbone.associate']
    }
  },

  callback: window.__karma__.start
};

function addSpecFileToConfig (requireConfig, filename) {
  requireConfig.deps.push(filename);
  requireConfig.shim[filename] = {
    deps: [
      'src/backbone.associate',
      'test/helper'
    ]
  };
}

var SPEC_RE = /^\/base\/(test\/.*\.spec)\.js$/;
Object.keys(window.__karma__.files).forEach(function (file) {
  var matches = file.match(SPEC_RE);
  if (matches) addSpecFileToConfig(requireConfig, matches[1]);
});

require.config(requireConfig);
