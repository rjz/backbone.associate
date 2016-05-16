(function () {

  var Backbone = this.Backbone,
      _ = this._;

  if (typeof window == 'undefined') {
    Backbone = require('backbone');
    _ = require('underscore');

    require('./helper');
    require('../src/backbone.associate');
  }

  describe('Example uses', function () {

    var Cities, City, Country, Flag;

    Country = Backbone.Model.extend({
      idAttribute: 'name',
      urlRoot: '/countries'
    });

    Flag = Backbone.Model.extend({});

    City = Backbone.Model.extend({ idAttribute: 'name' });

    Cities = Backbone.Collection.extend({ model: City });

    Backbone.associate(Country, {
      flag: { type: Flag },
      cities: { type: Cities }
    });

    describe('Setting associate parameters', function () {

      beforeEach(function () {
        Country.prototype.set = function (attributes) {
          var result = {},
            _this = this;

          _.each(attributes, function (value, key) {
            var attribute;
            attribute = _this.attributes[key];
            if (attribute instanceof Backbone.Collection) {
              attribute.reset(value);
            } else if (attribute instanceof Backbone.Model) {
              attribute.set(value);
            } else {
              result[key] = value;
            }
          });

          return Country.__super__.set.call(this, result);
        };
      });

      afterEach(function () {
        Country.prototype.set = Backbone.Model.prototype.set;
      });

      describe('Setting associated models', function () {

        beforeEach(function () {
          this.canada = new Country(Fixtures.testCountry, {
            parse: true
          });

          this.expected = { colors: ['green', 'blue'] };
        });

        it('should update model attributes', function () {
          this.canada.set({ flag: this.expected });
          expect(this.canada.flag().attributes).toEqual(this.expected);
        });

        it('should not change references', function () {
          var flag = this.canada.flag();
          this.canada.set({ flag: this.expected });
          expect(this.canada.flag() instanceof Flag).toBeTruthy();
          expect(this.canada.flag()).toBe(flag);
        });
      });

      describe('Setting associated collections', function () {

        beforeEach(function () {
          this.canada = new Country(Fixtures.testCountry, { parse: true });
          this.expected = [{ name: 'Saskatoon' }, { name: 'Windsor' }];
        });

        it('should reset associated collections', function () {
          this.canada.set({ cities: this.expected });
          expect(this.canada.cities().length).toEqual(this.expected.length);
          _.each(this.expected, function (city) {
            expect(this.canada.cities().get(city.name)).toBeTruthy();
          }, this);
        });

        it('should not change references', function () {
          var cities = this.canada.cities();
          this.canada.set({ cities: this.expected });
          expect(this.canada.cities() instanceof Cities).toBeTruthy();
          expect(this.canada.cities()).toBe(cities);
        });
      });
    });

    describe('Assigning Associate URLs', function () {

      beforeEach(function () {
        this.canada = new Country(Fixtures.testCountry, { parse: true });
      });

      describe('Assigning URLs for associated collections', function () {
        it('behaves as expected', function () {
          var city = this.canada.cities().first();
          this.expected = this.canada.url() + '/cities';
          this.canada.cities().url = this.expected;
          expect(city.url()).toEqual(this.expected + '/' + city.id);
        });
      });
    });

    describe('Listening to Associate Events', function () {

      beforeEach(function () {
        this.canada = new Country(Fixtures.testCountry, { parse: true });
        this.callback = jasmine.createSpy();
      });

      it('behaves as expected', function () {
        this.canada.listenTo(this.canada.cities(), 'add', this.callback);
        this.canada.cities().add({ name: 'St. John\'s' });
        expect(this.callback).toHaveBeenCalled();
      });
    });
  });

})();
