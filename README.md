Backbone Relations 
==================

Given a bunch of related models and collections:

    var Country = Backbone.Model.Extend({ /* ... */ });
    var Flag = Backbone.Model.Extend({ /* ... */ });
    var City = Backbone.Model.Extend({ /* ... */ });
    var Cities = Backbone.Collection.extend({ model: City });

It would be nice to have a simple way to describe the relationships 
between them. We don't need anything fancy.

    Backbone.associate(Country, {
      flag: { type: Flag },
      cities: { type: Cities }
    });

Now, whenever data is parsed, child resources can be instantiated 
and stored in the attribute hash:

    var data = {
      cities: [
        { name: 'Calgary' },
        { name: 'Regina' }
      ]
    }

    var canada = new Country(data, { parse: true });

When it's time to sync the parent resource back up with the server, 
child resources can be serialized and included in the request.

    canada.toJSON(); // { flag: { colors: ['red','white'] }, ...

Since associates are *just attributes*, they may be accessed at any 
time using the usual `get`:

    var cities = canada.get('cities');

Or through the sticky-sweet goodness of a sugary accessor:

    canada.flag().set({ colors: ['red','white'] });
    canada.cities().add([
      { name: 'Edmonton' },
      { name: 'Montreal' },
      { name: 'Ottawa' },
      { name: 'Vancouver' }
    ]);

That's handy for manipulating the relations, setting up eventing, or 
any of the many other things this plugin won't do for you.

### Things this plugin won't do for you...

..include managing children during `set` operations, configuring child 
URLs, identity mapping, and making presumptions about child events. 
Fortunately, all of these can be implemented as needed:

    // manage `set` operations
    Country.prototype.set = function (attributes) {
      var self = this,
          result = {};
    
      _.each(attributes, function (value, key) {
        var attribute = self.attributes[key];
        if (attribute instanceof Backbone.Collection) {
            attribute.reset(value);
        } else if (attribute instanceof Backbone.Model) {
            attribute.set(value);
        } else {
            result[key] = value;
        }
      });
      Backbone.Model.prototype.set.call(this, result);
    };

    // configure child URLs
    canada.cities().urlRoot = canada.url() + '/cities'
    canada.flag().url = canada.url() + '/flag'

    // rudimentary identity mapping
    var getCountry = function (id) {
      _countries = {};
      return (getCountry = function (id) {
        if (!_countries[id]) {
          _countries[id] = new Country({ id : id });
        }
        return _countries[id];
      })(id);
    };

    // handle child events
    canada.onCityAdded = function (model) {
      console.log('city added!', model.get('name'));
    }

    canada.listenTo(canada.cities(), 'add', canada.onCityAdded);

## Contributing

Contributions are welcome!

  1. Fork this repo
  2. Add your changes and update the spec as needed
  3. Submit a [pull request](help.github.com/pull-requests/)

