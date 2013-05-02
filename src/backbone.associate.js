/**
 *  backbone.associate.js v0.0.4
 *  (c) 2013, RJ Zaworski
 *
 *  Presumptionless model relations for Backbone.js
 *  Released under the MIT License
 */
(function (_, Backbone) {

  var  
    // Sift through a map of attributes and initialize any 
    // known associations
    _filterAssociates = function (attributes) {

      var self = this,
          current = self.attributes,
          association,
          associations = self._associations,
          omit = [];

      for (var key in associations) {
        association = associations[key];
        if (current[key] instanceof association.type) {
          if (attributes[key] instanceof association.type) {
            current[key] = attributes[key];
            omit.push(key);
          }
          else if (_.has(attributes, key))
          {
            if (current[key] instanceof Backbone.Model) {
              current[key].set(attributes[key]);
              omit.push(key);
            }
            else if (current[key] instanceof Backbone.Collection) {
              current[key].reset(attributes[key]);
              omit.push(key);
            }
          }
        }
        else if (!(attributes[key] instanceof association.type)) {
          attributes[key] = new (association.type)(attributes[key]);
        }
      }

      return _.omit(attributes, omit);
    },

    // Wraps a method, exposing an "unwrap" method for reverting it later
    _wrapMethod = function (wrapper, key) {
      var self = this,
          original = self[key],
          wrapped = _.wrap(original, wrapper);

      wrapped.unwrap = function () {
        self[key] = original;
      };

      self[key] = wrapped;
    },

    // Extensions to Backbone.Model for filtering associate data, etc, etc
    _extensions = {

      // Updates `set` to handle supplied attributes
      set: function (original, key, val, options) {
        var self = this, attributes;
        if (_.isObject(key))
          attributes = _.clone(key) ;
        else {
          attributes = {};
          attributes[key] = val;
        }
        if (_.isObject(val) && (typeof options === "undefined" || options === null)) {
          options = val;
        }

        m = _filterAssociates.call(self, attributes);
        return original.call(self, m, options);
      },

      // Updates `toJSON` to serialize associated objects
      toJSON: function (original, options) {
        var self = this,
            associations = self._associations,
            attributes = original.call(self, options);
        for (var key in associations) {
          if (attributes[key] instanceof associations[key]['type']) {
            attributes[key] = attributes[key].toJSON();
          }
        }
        return attributes;
      }
    },

    // Patch initialize method to setup associations and filter initial attributes
    _initialize = function (original, attrs, options) {

      var self = this,
          extensions = _.clone(_extensions);

      // Provide associate accessors
      for (key in self._associations) {
        extensions[key] = _.partial(self.get, key);
      }

      // Wrap extensions around existing class methods
      _.each(extensions, _wrapMethod, self);

      // Filter any attributes that slipped by without parsing
      _filterAssociates.call(self, self.attributes);

      // Pass control back to the original initialize method
      return original.call(self, attrs, options);
    };

  // Define associations for a model
  Backbone.associate = function (klass, associations) {

    var proto = klass.prototype;

    if (!proto._associations) {
      // Patch initialize method in prototype
      _wrapMethod.call(proto, _initialize, 'initialize');

      // Add namespace for associations
      proto._associations = {};
    }

    _.extend(proto._associations, associations);
  };

  // Remove model associations
  Backbone.dissociate = function (klass) {
    var proto = klass.prototype;
    proto.initialize.unwrap();
    proto._associations = null;
  };

})(_, Backbone);

