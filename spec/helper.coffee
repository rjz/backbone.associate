Backbone = require 'backbone'
_        = require 'underscore'

class TestModel extends Backbone.Model
  defaults:
    age: '',
    sex: '',
    name: ''
  validate: ->
    'Invalid' if @attributes.valid? && !@attributes.valid

class TestCollection extends Backbone.Collection
  model: TestModel

Fixtures =
  testModels: [
    { age: 35, sex: 'M', name: 'John' },
    { age: 26, sex: 'F', name: 'Joan' },
    { age: 24, sex: 'F', name: 'Jean' },
    { age: 33, sex: 'M', name: 'Joe' },
    { age: 26, sex: 'M', name: 'Jordan' }
  ]

  testCountry:
    name: 'Canada'
    cities: [
      { name: 'Calgary' }
      { name: 'Regina' }
    ]

TestHelpers =

  # Retrieve a random attribute (specified by key) from
  # the list of attributes in the supplied fixture
  getRandomAttr: (fixture, key) ->
    results = _.pluck(fixture, key)
    results[_.random(0, results.length - 1)]

  # Retrieve an array of fixture models where the specified
  # key has the specified value
  getExpectedResult: (fixture, key, value) ->
    whereVal = {}
    whereVal[key] = value
    _.where(fixture, whereVal )

globals =
  TestModel      : TestModel
  TestCollection : TestCollection
  Fixtures       : Fixtures
  TestHelpers    : TestHelpers

# Add globals to +root+
root[global] = module for global, module of globals

