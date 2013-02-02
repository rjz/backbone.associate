require './helper.coffee'
require '../src/backbone.associate.js'

class M extends Backbone.Model
class N extends Backbone.Model
class C extends Backbone.Collection
  model: N

describe 'association', ->

  beforeEach ->
    @modelA = M
    @modelB = N
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

  describe 'sanity checking', ->

    it 'panics if called more than once', ->
      redundancy = =>
        Backbone.associate @modelA, @associations
      expect(redundancy).toThrow 'Associations may be set only once per model'

    it 'throws an error before allowing circular references', ->
      circling = =>
        Backbone.associate @modelB, { boo: { type: @modelB } }
      expect(circling).toThrow 'Self-referential relation not permitted'

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
      model = new @modelA(expected, parse: true)
      for key, association of @associations
        if _.has(expected, key)
          expect(model[key]().attributes).toEqual expected[key]

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
  
