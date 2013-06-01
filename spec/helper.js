(function() {
  var Fixtures, TestCollection, TestHelpers, TestModel, global, globals, module;

  var Backbone = this.Backbone,
      _ = this._;

  if (typeof window == 'undefined') {
    Backbone = require('backbone');
    _ = require('underscore');

    require('./helper');
  }

  TestModel = Backbone.Model.extend({
    defaults: {
      age: '',
      sex: '',
      name: ''
    },

    validate: function() {
      if ((this.attributes.valid != null) && !this.attributes.valid) {
        return 'Invalid';
      }
    }
  });

  TestCollection = Backbone.Collection.extend({});

  Fixtures = {
    testModels: [
      { age: 35, sex: 'M', name: 'John' },
      { age: 26, sex: 'F', name: 'Joan' },
      { age: 24, sex: 'F', name: 'Jean' }, 
      { age: 33, sex: 'M', name: 'Joe' },
      { age: 26, sex: 'M', name: 'Jordan' }
    ],

    testCountry: {
      name: 'Canada',
      cities: [{ name: 'Calgary' }, { name: 'Regina' }]
    }
  };

  TestHelpers = {

    getRandomAttr: function(fixture, key) {
      var results = _.pluck(fixture, key);
      return results[_.random(0, results.length - 1)];
    },

    getExpectedResult: function(fixture, key, value) {
      var whereVal = {};
      whereVal[key] = value;
      return _.where(fixture, whereVal);
    }
  };

  globals = {
    TestModel: TestModel,
    TestCollection: TestCollection,
    Fixtures: Fixtures,
    TestHelpers: TestHelpers
  };

  for (global in globals) {
    module = globals[global];
    this[global] = module;
  }

}).call(this);
