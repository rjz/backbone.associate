/**
 *  backbone.associate.js v0.0.6
 *  (c) 2013, RJ Zaworski
 *
 *  Presumptionless model relations for Backbone.js
 *  Released under the MIT License
 */
(function (root, factory) {

  // CommonJS compatibilty
  if (typeof window == 'undefined') {
    factory(require('underscore'), require('backbone'));
  }
  else if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(['underscore', 'backbone'], function(_, Backbone) {
      // Use global variables if the locals are undefined.
      return factory(_ || root._, Backbone || root.Backbone);
    });
  }
  else {
    factory(root._, root.Backbone);
  }

})(this, function (_, Backbone) {

  var
    // Sift through a map of attributes and initialize any
    // known associations
    _filterAssociates = function (context, attributes, options) {

      var attrs, current = context.attributes,
          action, key, association, associations = context._associations,
          omit = [];

      for (key in associations) {
        association = associations[key];
        attrs = attributes[key];
        if (_isAssociatedType(association, current[key])) {
          if (_isAssociatedType(association, attrs)) {
            // Reassign associated resource
            current[key] = attrs;
            omit.push(key);
          }
          else if (attrs && attrs !== null)
          {
            // Update attributes of associated resource
            current[key].set(attrs, options);
            omit.push(key);
          }
        }
        else {
          attributes[key] = _buildAssociation(context, association, attrs, options);
        }
      }

      // Skip any attributes that have were handled by associations
      return _.omit(attributes, omit);
    },

    // Check whether the supplied object matches the association type
    _isAssociatedType = function (association, obj) {
      return (obj instanceof association.type);
    },

    // Builds an association
    _buildAssociation = function (context, association, attributes, options) {
      var result = new (association.type)(attributes, options);
      if (association.url) {
        // Assign a sensible default URL by appending the url parameter
        // to the url of the parent model.
        result.url = function () {
          return _.result(context, 'url') + _.result(association, 'url');
        };
      }
      return result;
    },

    // Wraps a method, exposing an "unwrap" method for reverting it later
    _wrapMethod = function (context, wrapper, key) {

      var original = context[key],
          wrapped = _.wrap(original, wrapper);

      wrapped.unwrap = function () {
        context[key] = original;
      };

      context[key] = wrapped;
    },

    // Extensions to Backbone.Model for filtering associate data, etc, etc
    _extensions = {

      // Updates `set` to handle supplied attributes
      set: function (original, key, val, options) {

        var self = this,
            attributes = {};

        if (_.isObject(key)) {
          _.extend(attributes, key);
        }
        else {
          attributes[key] = val;
        }
        if (_.isObject(val) && (typeof options === "undefined" || options === null)) {
          options = val;
        }

        return original.call(self, _filterAssociates(self, attributes, options), options);
      },

      // Updates `toJSON` to serialize associated objects
      toJSON: function (original, options) {

        var self = this,
            key, associations = self._associations,
            attributes = original.call(self, options);

        for (key in associations) {
          if (_isAssociatedType(associations[key], attributes[key])) {
            attributes[key] = attributes[key].toJSON();
          }
        }
        return attributes;
      }
    },

    // Patch initialize method to setup associations and filter initial attributes
    _initialize = function (original, attrs, options) {

      var self = this,
          key, extensions = _.clone(_extensions);

      // Provide associate accessors
      for (key in self._associations) {
        extensions[key] = _.partial(self.get, key);
      }

      // Wrap extensions around existing class methods
      _.each(extensions, _.partial(_wrapMethod, self));

      // Filter any attributes that slipped by without parsing
      _filterAssociates(self, self.attributes, options);

      // Pass control back to the original initialize method
      return original.call(self, attrs, options);
    };

  // Define associations for a model
  Backbone.associate = function (klass, associations) {

    var proto = klass.prototype;

    if (!proto._associations) {
      // Patch initialize method in prototype
      _wrapMethod(proto, _initialize, 'initialize');

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

  return Backbone;
});

