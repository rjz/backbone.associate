'use strict';

module.exports = function (config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine', 'requirejs'],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity,
    files: [
      {pattern:'node_modules/underscore/underscore.js', included: false},
      {pattern:'node_modules/backbone/backbone.js', included: false},
      {pattern:'node_modules/jquery/dist/jquery.js', included: false},
      {pattern: 'src/*.js', included: false},
      {pattern: 'test/**/*.spec.js', included: false},
      {pattern: 'test/helper.js', included: false},
      'test/browser-amd/test-main.js'
    ]
  });
};
