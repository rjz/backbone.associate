/* globals define: false */
/**
 *  backbone.associate.js v0.0.12
 *  (c) 2013 - 2016, RJ Zaworski and contributors
 *
 *  Presumptionless model relations for Backbone.js
 *  Released under the MIT License
 */
// istanbul ignore next
(function (root, factory) {

  'use strict';

  // Node.js or CommonJS compatibilty
  if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    module.exports = factory(_, Backbone);
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

  'use strict';

  // Sift through a map of attributes and initialize any
  // known associations
  function filterAssociates (context, attributes, options) {

    var attrs, association;
    var current = context.attributes;
    var associations = context._associations;
    var omit = [];

    for (var key in associations) {
      association = associations[key];
      attrs = attributes[key];
      if (isAssociatedType(association, current[key])) {
        if (isAssociatedType(association, attrs)) {
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
        attributes[key] = buildAssociation(context, association, attrs, options);
      }
    }

    // Skip any attributes that have were handled by associations
    return _.omit(attributes, omit);
  }

  // Check whether the supplied object matches the association type
  function isAssociatedType (association, obj) {
    return (obj instanceof association.type);
  }

  function buildAssociation (context, association, attributes, options) {
    var result = new (association.type)(attributes, options);
    if (association.url) {
      // Assign a sensible default URL by appending the url parameter
      // to the url of the parent model.
      result.url = function () {
        return _.result(context, 'url') + _.result(association, 'url');
      };
    }
    return result;
  }

  // Extensions to Backbone.Model for filtering associate data, etc, etc
  var extensions = {

    // Updates `set` to handle supplied attributes
    set: function (original, key, val, options) {

      var attributes = {};

      if (_.isObject(key)) {
        _.extend(attributes, key);
        if (typeof options === "undefined" || options === null) {
          options = val;
        }
      }
      else {
        attributes[key] = val;
      }

      return original.call(this, filterAssociates(this, attributes, options), options);
    },

    // Updates `toJSON` to serialize associated objects
    toJSON: function (original, options) {
      var associations = this._associations;
      var attributes = original.call(this, options);
      for (var key in associations) {
        if (isAssociatedType(associations[key], attributes[key])) {
          attributes[key] = attributes[key].toJSON(options);
        }
      }
      return attributes;
    }
  };

  // Patch initialize method to setup associations and filter initial attributes
  var initialize = function (attrs, options) {
    var key;

    // Provide associate accessors
    for (key in this._associations) {
      this[key] = _.partial(this.get, key);
    }

    // Wrap extensions around existing class methods
    for (key in extensions) {
      this[key] = _.wrap(this[key], extensions[key]);
    }

    // Filter any attributes that slipped by without parsing
    filterAssociates(this, this.attributes, options);

    // Pass control back to the original initialize method
    return this.__unassociatedInit.call(this, attrs, options);
  };

  // Define associations for a model
  Backbone.associate = function (klass, associations) {
    var proto = klass.prototype;

    if (!proto._associations) {
      // Patch initialize method in prototype
      proto.__unassociatedInit = proto.initialize;
      proto.initialize = initialize;
    }

    // Extend from an empty object in case proto._associations is undefined
    proto._associations = _.extend({}, proto._associations, associations);
  };

  // Remove model associations
  Backbone.dissociate = function (klass) {
    var proto = klass.prototype;
    proto.initialize = proto.__unassociatedInit;
    proto._associations = null;
  };

  return Backbone;
});
