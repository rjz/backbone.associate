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

  describe 'A model with associations', ->

    it 'should have accessors for each association', ->
      for key, association of @associations
        expect(_.isFunction @parent[key]).toBeTruthy()

    it 'should extend dependent methods', ->
      for meth in ['initialize','set','toJSON']
        expect(@parent[meth]).not.toEqual(Backbone.Model::[meth])

  describe 'When model is initialized', ->

    it 'should build empty associates if attributes were not provided', ->
      for key, association of @associations
        expect(@parent.get(key) instanceof association.type).toBeTruthy()

    it 'should not overwrite existing associates', ->
      expected = { one: { foo: 'bar' } }
      model = new @modelA expected
      for key, association of @associations
        if _.has(expected, key)
          expect(model[key]().attributes).toEqual expected[key]

    it 'should use defaults to populate associates', ->
      expected = { one: { foo: 'bar' } }
      defaults = @modelA::defaults
      @modelA::defaults = expected
      model = new @modelA {}
      for key, association of @associations
        if _.has expected, key
          expect(model[key]().attributes).toEqual expected[key]
      @modelA::defaults = defaults

    it 'should preserves references to associates', ->
      modelB = new @modelB
      modelA = new @modelA { one: modelB }
      expect(modelA.one() is modelB).toBeTruthy()

    it 'should recurse through associated objects', ->
      Backbone.associate @modelB, { two: { type: @modelC } }
      fooVal = 'bar'
      fixture = { one: { two: { foo: fooVal } } }
      @parent = new @modelA fixture
      expect(@parent.one().two().get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

  describe 'When properties on a model are set', ->

    beforeEach ->
      @fixture =
        a: 'foo'
        b: 42
        c: { hello: 'world' }
        one: { foo: 'bar' }
        manies: [{ id: 'foo' }]

    it 'should not affect unrelated keys', ->
      @parent.set @fixture
      for key, expected of @fixture
        unless _.include _.keys(@associations), key
          expect(@parent.attributes[key]).toEqual expected

    it 'should fill in associations when no attributes are provided', ->
      @parent.set @fixture
      for key, association of @associations
        expect(@parent.attributes[key] instanceof association.type).toBeTruthy()

    it 'should not change original arguments', ->
      expected = _.clone @fixture
      @parent.set expected
      expect(_.isEqual @fixture, expected).toBeTruthy()

    it 'should parse model relations', ->
      @parent.set @fixture
      for key, expected of @fixture
        if _.has(@parent._associations, key) && @parent[key]() instanceof Backbone.Model
          expect(@parent[key]() instanceof @associations[key].type).toBeTruthy()
          expect(@parent[key]().get('foo')).toEqual @fixture[key].foo

    it 'should parse collection relations', ->
      @parent.set @fixture
      for key, expected of @fixture
        if _.has(@parent._associations, key) && @parent[key]() instanceof Backbone.Collection
          expect(@parent[key]() instanceof @associations[key].type).toBeTruthy()
          expect(@parent[key]().first().get('foo')).toEqual @fixture[key][0].foo

    it 'should preserve passed model references', ->
      model = new @modelB
      @parent.set _.extend(@fixture, one: model)
      expect(@parent.one() is model).toBeTruthy()

    it 'should preserve passed collection references', ->
      collection = new @collectionB
      @parent.set _.extend(@fixture, manies: collection)
      expect(@parent.manies() is collection).toBeTruthy()

    it 'should preserve references to associated models', ->
      expected = @parent.one()
      @parent.set { one: { 'foo': 'bar' } }
      expect(@parent.one()).toEqual expected

    it 'should preserve references to associated collections', ->
      expected = @parent.manies()
      @parent.set [{ id: 'mixcoatl', foo: 'bar' }]
      expect(@parent.manies()).toEqual expected

    it 'should recurses for nested models', ->
      klass = Backbone.Model.extend {}
      Backbone.associate @modelB, { two: { type: klass } }
      fooVal = 'bar'
      fixture = { one: { two: { foo: fooVal } } }
      model = new @modelA
      model.set fixture
      expect(model.one().two().get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

    it 'should recurse for nested collections', ->
      klass = Backbone.Collection.extend model: @modelC
      Backbone.associate @modelB, { two: { type: klass } }
      fooVal = 'bar'
      fixture = { one: { two: [ { id: 'three', foo: fooVal }] } }
      model = new @modelA
      model.set fixture
      expect(model.one().two().get('three').get('foo')).toEqual fooVal
      Backbone.dissociate @modelB

  describe 'When serializing model associations', ->

    it 'should convert models to attribute hash', ->
      expected = foo: 'bar'
      @parent.one().set expected
      result = @parent.toJSON()
      expect(result.one).toEqual expected

    it 'should convert collections to model arrays', ->
      expected = [{ id: 'foo' }]
      @parent.manies().reset expected
      result = @parent.toJSON()
      expect(result.manies).toEqual expected
 
  describe 'When an association is inherited', ->

    it 'should be defined for the child', ->
      class modelAChild extends @modelA
        initialize: -> super
      child = new modelAChild
      expect(child.one() instanceof @modelB).toBeTruthy()
      expect(child.manies() instanceof @collectionB).toBeTruthy()

