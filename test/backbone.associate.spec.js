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
      P = Backbone.Model.extend({
        toJSON: function( options ) {
          return options;
        }
      }),
      C = Backbone.Collection.extend({
        model: N
      });

  describe('association', function () {

    beforeEach(function () {
      this.modelA = M;
      this.modelB = N;
      this.modelC = O;
      this.modelD = P;
      this.collectionB = C;

      this.associations = {
        one: { type: this.modelB },
        manies: { type: this.collectionB }
      };

      Backbone.associate(this.modelA, this.associations);

      this.parent = new this.modelA();
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
        var modelB = new this.modelB(),
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
      
      it('should set unassociated properties to Backbone.Model objects', function() {
        var modelB = new this.modelB();
        this.parent.set('b', modelB);
        expect(this.parent.attributes.b).toEqual(modelB);
      });
    });

    describe('When properties on a model are set by hash', function () {

      beforeEach(function () {
        this.fixture = {
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
        var model = new this.modelB();
        this.parent.set(_.extend(this.fixture, { one: model }));
        expect(this.parent.one() === model).toBeTruthy();
      });

      it('should preserve passed collection references', function () {
        var collection = new this.collectionB();
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

        model = new this.modelA();
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

        model = new this.modelA();
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

      describe('when options are specified', function () {

        it('should pass the options to the child model\'s toJSON method', function () {
          var Parent = Backbone.Model.extend({});
          Backbone.associate( Parent, {
            child: { type:this.modelD }
          });

          var p = new Parent(),
              options = {},
              result = p.toJSON( options );

          expect( result.child ).toEqual( options );
        });
      });
    });

    describe('When an association is inherited', function () {

      it('should be defined for the child', function () {
        var modelAChild = this.modelA.extend({}),
            child = new modelAChild();

        expect(child.one() instanceof this.modelB).toBeTruthy();
        expect(child.manies() instanceof this.collectionB).toBeTruthy();
      });
    });

    describe('when relation url is provided', function () {

      var model, klass;

      beforeEach(function () {
        klass = Backbone.Collection.extend({
          model: this.modelC
        });

        Backbone.associate(this.modelB, {
          two: {
            type: klass,
            url: '/two' // TODO: functions should work, too!
          },
          three: {
            type: klass,
            url: function () {
              return '/three';
            }
          }
        });

        model = new this.modelB({}, { parse: true });
        model.url = '/modelbs/42';
      });

      it('should build relation url from string', function () {
        expect(model.two().url()).toEqual('/modelbs/42/two');
      });

      it('should evaluate url from function', function () {
        expect(model.three().url()).toEqual('/modelbs/42/three');
      });

      describe('and child is added to parent collection', function () {
        beforeEach(function () {
          model.two().add({ id: 31 });
        });

        it('should have correct url', function () {
          expect(model.two().last().url()).toEqual('/modelbs/42/two/31');
        });
      });
    });

    describe('when relation url is not provided', function () {

      var model, klass;

      beforeEach(function () {
        klass = Backbone.Collection.extend({
          model: this.modelC,
          url: '/klasses'
        });

        Backbone.associate(this.modelB, {
          two: { type: klass }
        });

        model = new this.modelB({}, { parse: true });
        model.url = '/modelbs/42';
      });

      it('should revert to related object\'s url', function () {
        expect(_.result(model.two(), 'url')).toEqual('/klasses');
      });
    });
    
    describe('(#15) parent, child, sibling associations', function () {

      var SuperModel, Child, klass1, klass2;
    
      beforeEach(function () {
    
        SuperModel = Backbone.Model.extend();
    
        klass1 = Backbone.Collection.extend({});
        klass2 = Backbone.Collection.extend({});
    
        Backbone.associate(SuperModel, {
          other: { type: klass1 }
        });
    
        Child = SuperModel.extend();
    
        Backbone.associate(Child, {
          another: { type: klass2 }
        });
      });
    
      it('leaves original child associations intact', function () {
        var m = new Child();
        expect(m.get('another') instanceof klass2).toEqual(true);
      });
    
      it('includes parent association in child association list', function () {
        var m = new Child();
        expect(m.get('other') instanceof klass1).toEqual(true);
      });
    
      describe('when a sibling is defined', function () {
    
        var ChildSibling;
    
        beforeEach(function () {
    
          ChildSibling = SuperModel.extend();
    
          Backbone.associate(ChildSibling, {
            another: { type: klass1 }
          });
        });
    
        it('leaves original child associations intact', function () {
          var m = new Child();
          expect(m.get('another') instanceof klass2).toEqual(true);
        });
    
        it('allows new child associations in sibling', function () {
          var m = new ChildSibling();
          expect(m.get('another') instanceof klass1).toEqual(true);
        });
    
        it('includes parent association in both sibling\'s association list', function () {
          var m = new Child();
          var n = new ChildSibling();
          expect(m.get('other') instanceof klass1).toEqual(true);
          expect(n.get('other') instanceof klass1).toEqual(true);
        });
      });
    });
    
  });
})();

