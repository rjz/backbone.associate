/**
 *  backbone.associate.js v0.0.3
 *  MIT License
 */
(function (_, Backbone) {

  var _slice = [].slice,

    // Helper: sift through the supplied attributes and replace with
    // associated models as needed
    _filterAssociates = function (attributes) {
      var associations = this._associations;
      for (var key in associations) {
        if (!(attributes[key] instanceof associations[key]['type'])) {
          attributes[key] = new (associations[key]['type'])(attributes[key]);
        }
      }
      return attributes;
    },

    // wraps a method, exposing an "unwrap" method for reverting it later
    _wrapMethod = function (meth, key) {
      var self = this,
          original = self[key];

      var wrapped = function () {
        return meth.apply(this, [original].concat(_slice.call(arguments)));
      };

      wrapped.unwrap = function () {
        self[key] = original;
      };

      self[key] = wrapped;
    },

    // Extensions to Backbone.Model for filtering associate data, etc, etc
    _extensions = {

      // Update `parse` to create instances of related types and
      // replace the corresponding entries in the attribute hash.
      parse: function (original, resp, options) {

        var self = this,
            attributes = _.defaults(_.clone(resp), self['attributes'], self['defaults']);

        return original.call(self, _filterAssociates.call(self, attributes), options);
      },

      // Updates `toJSON` to serialize the contents of associated objects
      // into the attributes hash. 
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

    // Patch initialize method to setup associations and filter
    // initial attributes when class is instantiated
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
    klass.prototype.initialize.unwrap();
    klass.prototype._associations = null;
  };

})(_, Backbone);

