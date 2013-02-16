require './helper.coffee'
require '../src/backbone.associate.js'

describe 'Example uses', ->

  class Country extends Backbone.Model
    idAttribute: 'name'
    url: -> '/countries/' + this.id
  class Flag extends Backbone.Model
  class City extends Backbone.Model
     idAttribute: 'name'
  class Cities extends Backbone.Collection
    model: City

  Backbone.associate Country,
    flag: { type: Flag }
    cities: { type: Cities }

  describe 'Setting associate parameters', ->
    beforeEach ->
      Country::set = (attributes) ->
        result = {}
        _.each attributes, (value, key) =>
          attribute = @attributes[key]
          if attribute instanceof Backbone.Collection
            attribute.reset value
          else if attribute instanceof Backbone.Model
            attribute.set value
          else
            result[key] = value
        super result

    afterEach ->
      Country::set = Backbone.Model::set

    describe 'Setting associated models', ->
      beforeEach ->
        @canada = new Country Fixtures.testCountry, parse: true
        @expected = colors: ['green', 'blue']

      it 'should update model attributes', ->
        @canada.set flag: @expected
        expect(@canada.flag().attributes).toEqual @expected

      it 'should not change references', ->
        flag = @canada.flag()
        @canada.set flag: @expected
        expect(@canada.flag() instanceof Flag).toBeTruthy()
        expect(@canada.flag() is flag).toBeTruthy()

    describe 'Setting associated collections', ->
      beforeEach ->
        @canada = new Country Fixtures.testCountry, parse: true
        @expected = [{ name: 'Saskatoon' }, { name: 'Windsor' }]

      it 'should reset associated collections', ->
        @canada.set cities: @expected
        expect(@canada.cities().length).toEqual @expected.length
        _.each @expected, (city) =>
          expect(@canada.cities().get(city.name)).toBeTruthy()
      
      it 'should not change references', ->
        cities = @canada.cities()
        @canada.set cities: @expected
        expect(@canada.cities() instanceof Cities).toBeTruthy()
        expect(@canada.cities() is cities).toBeTruthy()

  describe 'Assigning Associate URLs', ->
    beforeEach ->
      @canada = new Country Fixtures.testCountry, parse: true

    describe 'Assigning URLs for associated collections', ->
      it 'behaves as expected', ->
        @expected = @canada.url() + '/cities'
        city = @canada.cities().first()
        @canada.cities().url = @expected
        expect(city.url()).toEqual @expected + '/' + city.id

  describe 'Listening to Associate Events', ->
    beforeEach ->
      @canada = new Country Fixtures.testCountry, parse: true
      @callback = jasmine.createSpy()

    it 'behaves as expected', ->
      @canada.listenTo @canada.cities(), 'add', @callback
      @canada.cities().add { name: 'St. John\'s' }
      expect(@callback).toHaveBeenCalled()

