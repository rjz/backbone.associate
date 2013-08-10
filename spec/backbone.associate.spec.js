(function () {

  var Backbone = this.Backbone,
      _ = this._;

  if (typeof window == 'undefined') {
    Backbone = require('backbone');
    _ = require('underscore');

    require('./helper');
    require('../src/backbone.associate');
  }

  var M = Backbone.Model.extend({}),
      N = Backbone.Model.extend({}),
      O = Backbone.Model.extend({}),
      C = Backbone.Collection.extend({
        model: N
      });

  describe('association', function () {

    beforeEach(function () {
      this.modelA = M;
      this.modelB = N;
      this.modelC = O;
      this.collectionB = C;

      this.associations = {
        one: { type: this.modelB },
        manies: { type: this.collectionB }
      };

      Backbone.associate(this.modelA, this.associations);

      this.parent = new this.modelA;
    });

    afterEach(function () {
      return Backbone.dissociate(this.modelA);
    });

    describe('A model with associations', function () {

      it('should have accessors for each association', function () {
        _.each(this.associations, function (association, key) {
          expect(_.isFunction(this.parent[key])).toBeTruthy();
        }, this);
      });

      it('should extend dependent methods', function () {
        var methods = ['initialize', 'set', 'toJSON'];
        _.each(methods, function (meth, key) {
          expect(this.parent[meth]).not.toEqual(Backbone.Model.prototype[meth]);
        }, this);
      });
    });

    describe('When model is initialized', function () {
      
      it('should build empty associates if attributes were not provided', function () {
        _.each(this.associations, function (association, key) {
          expect(this.parent.get(key) instanceof association.type).toBeTruthy();
        }, this);
      });

      it('should not overwrite existing associates', function () {
        var expected = { one: { foo: 'bar' } },
            model = new this.modelA(expected);

        _.each(_.pick(this.associations, _.keys(expected)), function (association, key) {
            expect(model[key]().attributes).toEqual(expected[key]);
        });
      });

      it('should use defaults to populate associates', function () {
        var model,
            expected = { one: { foo: 'bar' } };

        this.modelA.prototype.defaults = expected;
        model = new this.modelA({});
        _.each(_.pick(this.associations, _.keys(expected)), function (association, key) {
          expect(model[key]().attributes).toEqual(expected[key]);
        });
      });

      it('should preserves references to associates', function () {
        var modelB = new this.modelB,
            modelA = new this.modelA({ one: modelB });

        expect(modelA.one()).toBe(modelB);
      });

      it('should recurse through associated objects', function () {
        var fooVal = 'bar',
            fixture = { 
              one: { two: { foo: fooVal } }
            };

        Backbone.associate(this.modelB, {
          two: { type: this.modelC }
        });

        this.parent = new this.modelA(fixture);
        expect(this.parent.one().two().get('foo')).toEqual(fooVal);
        return Backbone.dissociate(this.modelB);
      });
    });

    describe('When a model property is set by key and value', function () {

      it('should accept a key and its value as arguments', function () {
        this.parent.set('a', 'foo');
        expect(this.parent.attributes.a).toEqual('foo');
      });

      it('should set one-to-one relations', function () {
        this.parent.set('one', { foo: 'bar' });
        expect(this.parent.one().attributes.foo).toEqual('bar');
      });

      it('should set one-to-many relations', function () {
        this.parent.set('manies', [{ id: 'foo' }]);
        expect(this.parent.manies().get('foo')).toBeDefined();
      });
    });

    describe('When properties on a model are set by hash', function () {

      beforeEach(function () {
        return this.fixture = {
          a: 'foo',
          b: 42,
          c: { hello: 'world' },
          one: { foo: 'bar' },
          manies: [{ id: 'foo' }, { id: 'baz' }]
        };
      });

      it('should not affect unrelated keys', function () {
        var unrelated = _.omit(this.fixture, _.keys(this.associations));
        this.parent.set(this.fixture);
        _.each(unrelated, function (expected, key) {
            expect(this.parent.attributes[key]).toEqual(expected);
        }, this);
      });

      it('should fill in associations when no attributes are provided', function () {
        this.parent.set(this.fixture);
        _.each(this.associations, function (association, key) {
          expect(this.parent.attributes[key] instanceof association.type).toBeTruthy();
        }, this);
      });

      it('should not change original arguments', function () {
        var expected = _.clone(this.fixture);
        this.parent.set(expected);
        expect(_.isEqual(this.fixture, expected)).toBeTruthy();
      });

      describe('when relation keys are omitted', function () {

        it('should not clobber existing model relations', function () {
          var expected, expectedAttr;
          this.parent.set(this.fixture);
          expected = this.parent.one();
          expectedAttr = this.parent.one().get('foo');
          this.parent.set({ a: 'foobar' });
          expect(this.parent.one()).toEqual(expected);
          expect(this.parent.one().get('foo')).toEqual(expectedAttr);
        });

        it('should not clobber existing collection relations', function () {
          var expected, expectedLength;
          this.parent.set(this.fixture);
          expected = this.parent.manies();
          expectedLength = this.parent.manies().length;
          this.parent.set({ a: 'foobar' });
          expect(this.parent.manies()).toEqual(expected);
          expect(this.parent.manies().length).toEqual(expectedLength);
        });

      });

      it('should parse model relations', function () {
        this.parent.set(this.fixture);
        _.each(this.fixture, function (expected, key) {
          if (_.has(this.parent._associations, key) && this.parent[key]() instanceof Backbone.Model) {
            expect(this.parent[key]() instanceof this.associations[key].type).toBeTruthy();
            expect(this.parent[key]().get('foo')).toEqual(this.fixture[key].foo);
          }
        }, this);
      });

      it('should parse collection relations', function () {
        this.parent.set(this.fixture);
        _.each(this.fixture, function (expected, key) {
          if (_.has(this.parent._associations, key) && this.parent[key]() instanceof Backbone.Collection) {
            expect(this.parent[key]() instanceof this.associations[key].type).toBeTruthy();
            expect(this.parent[key]().first().get('foo')).toEqual(this.fixture[key][0].foo);
          }
        }, this);
      });

      it('should preserve passed model references', function () {
        var model = new this.modelB;
        this.parent.set(_.extend(this.fixture, { one: model }));
        expect(this.parent.one() === model).toBeTruthy();
      });

      it('should preserve passed collection references', function () {
        var collection = new this.collectionB;
        this.parent.set(_.extend(this.fixture, {
          manies: collection
        }));
        expect(this.parent.manies() === collection).toBeTruthy();
      });

      it('should preserve references to associated models', function () {
        var expected = this.parent.one();
        this.parent.set({ one: { 'foo': 'bar' } });
        expect(this.parent.one()).toEqual(expected);
      });

      it('should preserve references to associated collections', function () {
        var expected = this.parent.manies();
        this.parent.set([{ id: 'mixcoatl', foo: 'bar' }]);
        expect(this.parent.manies()).toEqual(expected);
      });

      it('should recurses for nested models', function () {
        var model, 
            klass = Backbone.Model.extend({}),
            fooVal = 'bar',
            fixture = {
              one: {
                two: { foo: fooVal }
              }
            };

        Backbone.associate(this.modelB, { two: { type: klass } });

        model = new this.modelA;
        model.set(fixture);
        expect(model.one().two().get('foo')).toEqual(fooVal);
        return Backbone.dissociate(this.modelB);
      });

      it('should recurse for nested collections', function () {

        var model,
            fooVal = 'bar',
            klass = Backbone.Collection.extend({ model: this.modelC }),
            fixture = {
              one: {
                two: [{ id: 'three', foo: fooVal }]
              }
            };

        Backbone.associate(this.modelB, { two: { type: klass } });

        model = new this.modelA;
        model.set(fixture);
        expect(model.one().two().get('three').get('foo')).toEqual(fooVal);

        Backbone.dissociate(this.modelB);
      });
    });

    describe('When serializing model associations', function () {

      it('should convert models to attribute hash', function () {
        var result, 
            expected = { foo: 'bar' };
        this.parent.one().set(expected);
        result = this.parent.toJSON();
        expect(result.one).toEqual(expected);
      });

      it('should convert collections to model arrays', function () {
        var result,
            expected = [{ id: 'foo' }];

        this.parent.manies().reset(expected);
        result = this.parent.toJSON();
        expect(result.manies).toEqual(expected);
      });
    });

    describe('When an association is inherited', function () {

      it('should be defined for the child', function () {
        var modelAChild = this.modelA.extend({}),
            child = new modelAChild;

        expect(child.one() instanceof this.modelB).toBeTruthy();
        expect(child.manies() instanceof this.collectionB).toBeTruthy();
      });

    });

    describe('when updated', function () {
      var fixture = {
            one:     { two: [{ id: 'three' }] },
            another: { two: [{ id: 'four' }] }
          };

      describe('with the reset parameter omitted', function () {
        it('should update using `set`', function () {
          var model, spy = jasmine.createSpy(),
              klass = Backbone.Collection.extend({ model: this.modelC });

          Backbone.associate(this.modelB, {
            two: { type: klass }
          });

          model = new this.modelB(fixture.one, { parse: true });
          model.two().set = spy;
          model.set(fixture.another); // should pass options through
          expect(spy).toHaveBeenCalled();
        });
      });

      describe('When the reset parameter is false', function () {
        it('should update using `set`', function () {
          var model, spy = jasmine.createSpy(),
              klass = Backbone.Collection.extend({ model: this.modelC });

          Backbone.associate(this.modelB, {
            two: { type: klass }
          });

          model = new this.modelB(fixture.one, { parse: true });
          model.two().set = spy;
          model.set(fixture.another); // should pass options through
          expect(spy).toHaveBeenCalled();
        });
      });

      describe('When the reset parameter is true', function () {
        it('should update using `reset`', function () {
          var model, spy = jasmine.createSpy(),
              klass = Backbone.Collection.extend({ model: this.modelC });

          Backbone.associate(this.modelB, {
            two: { type: klass, reset: true }
          });

          model = new this.modelB(fixture.one, { parse: true });
          model.two().reset = spy;
          model.set(fixture.another); // should pass options through
          expect(spy).toHaveBeenCalled();
        });
      });
    });

    describe('When the URL parameter is set', function () {
      var fixture = {
            one:     { two: [{ id: 'three' }] },
            another: { two: [{ id: 'four' }] }
          };

      it('should set the URL for associated resources', function () {
        var model, spy = jasmine.createSpy(),
            klass = Backbone.Collection.extend({ model: this.modelC });

        Backbone.associate(this.modelB, {
          two: {
            type: klass,
            reset: true,
            url: '/two'
          }
        });

        model = new this.modelB(fixture.one, { parse: true });
        model.url = '/modelbs/42';
        expect(model.two().url()).toEqual('/modelbs/42/two');
      });

      it('should set the URL for related collections', function () {
      });
    });
  });
})();

