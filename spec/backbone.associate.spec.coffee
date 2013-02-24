require './helper.coffee'
require '../src/backbone.associate.js'

class M extends Backbone.Model
class N extends Backbone.Model
class O extends Backbone.Model
class C extends Backbone.Collection
  model: N

describe 'association', ->

  beforeEach ->
    @modelA = M
    @modelB = N
    @modelC = O
    @collectionB = C

    @associations =
      one: { type: @modelB }
      manies: { type: @collectionB }

    Backbone.associate @modelA, @associations

    @parent = new @modelA

  afterEach ->
    Backbone.dissociate @modelA

  withType = (associations, type) =>
    whitelist = _.select associations, (association, key) ->
      new association.type instanceof type
    _.pick associations, whitelist

  describe 'association', ->

    it 'adds an accessor', ->
      for key, association of @associations
        expect(_.isFunction @parent[key]).toBeTruthy()

    it 'applies extensions', ->
      for meth in ['initialize','parse','toJSON']
        expect(@parent[meth]).not.toEqual(Backbone.Model::[meth])

  describe 'initialize', ->

    it 'creates associates that were not passed in', ->
      for key, association of @associations
        expect(@parent.get(key) instanceof association.type).toBeTruthy()

    it 'does not overwrite existing associates', ->
      expected = { one: { foo: 'bar' } }
      model = new @modelA expected
      for key, association of @associations
        if _.has(expected, key)
          expect(model[key]().attributes).toEqual expected[key]

    it 'does overwrite defaults', ->
      expected = { one: { foo: 'bar' } }
      defaults = @modelA::defaults
      @modelA::defaults = expected
      model = new @modelA {}
      for key, association of @associations
        if _.has expected, key
          expect(model[key]().attributes).toEqual expected[key]
      @modelA::defaults = defaults

    it 'preserves references', ->
      modelB = new @modelB
      modelA = new @modelA { one: modelB }
      expect(modelA.one() is modelB).toBeTruthy()

    it 'recurses', ->
      Backbone.associate @modelB, { two: { type: @modelC } }
      fooVal = 'bar'
      fixture = { one: { two: { foo: fooVal } } }
      @parent = new @modelA fixture
      expect(@parent.one().two().get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

  describe 'parsing', ->

    beforeEach ->
      @fixture =
        a: 'foo'
        b: 42
        c: { hello: 'world' }
        one: { foo: 'bar' }
        manies: [{ id: 'foo' }]

    it 'does not affect unrelated keys', ->
      result = @parent.parse @fixture
      for key, expected of @fixture
        unless _.include _.keys(@associations), key
          expect(result[key]).toEqual expected

    it 'does not affect arguments', ->
      expected = _.clone @fixture
      @parent.parse @fixture
      expect(_.isEqual @fixture, expected).toBeTruthy()

    it 'parses model relations', ->
      ones = _.keys withType @associations, Backbone.Model
      result = @parent.parse @fixture
      for key, expected of @fixture
        if _.include ones, key
          expect(result[key] instanceof @associations[key].type).toBeTruthy()
          expect(result[key].get('foo')).toEqual @fixture[key].foo

    it 'parses collection relations', ->
      manies = _.keys withType @associations, Backbone.Collection
      result = @parent.parse @fixture
      for key, expected of @fixture
        if _.include manies, key
          expect(result[key] instanceof @associations[key].type).toBeTruthy()
          expect(result[key].get('foo')).toEqual @fixture[key][0]

    it 'preserves references', ->
      model = new @modelB
      result = @parent.parse _.extend(@fixture, one: model)
      expect(result.one is model).toBeTruthy()

    it 'recurses for nested models', ->
      klass = Backbone.Model.extend {}
      Backbone.associate @modelB, { two: { type: klass } }
      fooVal = 'bar'
      fixture = { one: { two: { foo: fooVal } } }
      result = (new @modelA).parse fixture
      expect(result.one.two().get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

    it 'recurses for nested collections', ->
      klass = Backbone.Collection.extend model: @modelC
      Backbone.associate @modelB, { two: { type: klass } }
      fooVal = 'bar'
      fixture = { one: { two: [ { id: 'three', foo: fooVal }] } }
      result = (new @modelA).parse fixture
      expect(result.one.two().get('three').get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

  describe 'serializing', ->

    it 'converts models to attribute hash', ->
      expected = foo: 'bar'
      ones = withType @associations, Backbone.Model

      for key, association of ones
        @parent[key]().set expected

      result = @parent.toJSON()

      for key, association of ones
        expect(_.isEqual result[key], expected).toBeTruthy()

    it 'converts collections to model arrays', ->
      expected = [{ id: 'foo' }]
      manies = withType @associations, Backbone.Collection

      for key, association of manies
        @parent[key]().reset expected
      
      result = @parent.toJSON()

      for key, association of manies
        expect(_.isEqual(result[key], expected)).toBeTruthy()
 
  describe 'an inherited association', ->
    it 'is defined for the child', ->
      class modelAChild extends @modelA
        initialize: -> super
      child = new modelAChild
      expect(child.one() instanceof @modelB).toBeTruthy()
      expect(child.manies() instanceof @collectionB).toBeTruthy()

