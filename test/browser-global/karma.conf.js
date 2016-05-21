/* jshint strict: false */
module.exports = function(config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine'],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity,
    files: [
      'node_modules/underscore/underscore.js',
      'node_modules/backbone/backbone.js',
      {pattern: 'src/*.js', included: true},
      {pattern: 'test/**/*.spec.js', included: true},
      {pattern: 'test/helper.js', included: true}
    ]
  });
};
