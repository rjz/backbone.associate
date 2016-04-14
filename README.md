Backbone.associate 
==================

Presumptionless model relations for Backbone in < 1kb.

[![Build Status](https://travis-ci.org/rjz/backbone-associate.png)](https://travis-ci.org/rjz/backbone-associate)
[![Coverage Status](https://coveralls.io/repos/rjz/backbone.associate/badge.png?branch=master)](https://coveralls.io/r/rjz/backbone.associate?branch=master)

## Usage

Use `Backbone.associate` to define relationships between application models 
and collections.

    var Flag = Backbone.Model.Extend({ /* ... */ }),
        City = Backbone.Model.Extend({ /* ... */ }),
        Cities = Backbone.Collection.extend({ model: City }),
        Country = Backbone.Model.Extend({ /* ... */ });

    Backbone.associate(Country, {
      flag: { type: Flag },
      cities: { type: Cities, url: '/cities' }
    });

Here, we're associating a model (`Country`) with two relations: a `Flag`
model and a collection of `Cities`. The association keys can be anything,
but they should match the keys used in the data that will be passed into
the application's `parse` method.

    var canada = new Country({
      url: '/countries/canada',
      flag: { 
        colors: ['red','white'] 
      },
      cities: [
        { name: 'Calgary' },
        { name: 'Regina' }
      ]
    });

When it's time to sync the parent resource back up with the server, 
child resources can be serialized and included in the request.

    canada.toJSON(); // { flag: { colors: ['red','white'] }, ...

Since associates are *just attributes*, they may be accessed at any 
time using the usual `get`. 

    // GET /countries/canada/cities
    canada.get('cities').fetch();

For the truly lazy, `associate` provides a convenient accessor for 
each association:

    canada.flag().set({ colors: ['red','white'] });
    canada.cities().add([
      { name: 'Edmonton' },
      { name: 'Montreal' },
      { name: 'Ottawa' },
      { name: 'Vancouver' }
    ]);

That's handy for manipulating the relations, setting up eventing, or 
any of the many other things this plugin won't do for you. Speaking of
which,

## Things this plugin won't do...

...include making any but the most basic presumptions about how it will 
be used. Fortunately, all of these can be implemented as needed 
([fiddle here](http://jsfiddle.net/rjzaworski/79T94/)):

#### Identity mapping

    var getCountry = function (id) {
      _countries = {};
      return (getCountry = function (id) {
        if (!_countries[id]) {
          _countries[id] = new Country({ id : id });
        }
        return _countries[id];
      })(id);
    };

#### Child events

    canada.onCityAdded = function (model) {
      console.log('city added!', model.get('name'));
    }

    canada.listenTo(canada.cities(), 'add', canada.onCityAdded);

## Testing

Specs are implemented with `jasmine-node`. After cloning this repo, 
install dependencies and test with npm.

    $ npm install
    $ npm test

...and there's code coverage, too:

    $ npm run cover

## Related projects

Looking for a more fully-featured alternative? Check out:

  * [Backbone.Relational](https://github.com/PaulUithol/Backbone-relational)
  * [Supermodel](https://github.com/pathable/supermodel)

## License

Backbone.associate is released under the terms of the MIT license

