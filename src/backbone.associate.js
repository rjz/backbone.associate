/**
 *  backbone.associate.js v0.0.1
 *  MIT License
 */
(function (_, Backbone) {

  var Association = (function () {

    // Defines an Association
    function Association (klass, associations) {

      var self = this,
          originalMethods = {},
          proto = klass.prototype;

      // Check that associates haven't already been defined
      if (klass._associates) {
        throw new Error('Associations may be set only once per model');
      }

      // Sanitize associations and add accessors
      _.each(associations, function (association, key) {
        if (association.type == klass) {
          throw new Error('Self-referential relation not permitted');
        }

        self.extensions[key] = function () {
          return this.get(key);
        }
      });

      // apply extensions
      _.each(self.extensions, function (meth, key) {
        var original = originalMethods[key] = proto[key];
        proto[key] = function () {
          var args = [associations, original].concat([].slice.call(arguments));
          return meth.apply(this, args);
        };
      });

      // store metadata for class (enables dissociation)
      klass._associates = _.extend(this, {
        klass: klass,
        methods: originalMethods
      });
    };

    // self-destruct this association
    Association.prototype.remove = function () {
      var klass = this.klass;
      for (meth in this.methods) {
        klass.prototype[meth] = this.methods[meth];
      }
      klass._associates = null;
    };

    // Expose association extensions
    Association.prototype.extensions = {

      // Update initialize method to create empty associations where 
      // they do not already exist--useful for new models that will
      // not come pre-populated with data of their own.
      //
      // If calling `initialize` with data loaded outside the model,
      // be sure to pass set the `parse` option to ensure that child
      // resources will be created.
      initialize: function (associations, original) {
        var attrs = this.attributes;
        for (key in associations) {
          if (!_.has(attrs, key)) {
            attrs[key] = new (associations[key].type)(attrs[key]);
          }
        }
        return original.apply(this, arguments);
      },

      // Update `parse` to create instances of related types and
      // replace the corresponding entries in the attribute hash.
      parse: function (associations, original, resp, xhr) {
        var attributes = _.defaults(_.clone(resp), this.defaults);
        for (key in associations) {
          attributes[key] = new (associations[key].type)(attributes[key]);
        }
        return original.call(this, attributes, xhr);
      },

      // Updates `toJSON` to serialize the contents of related types
      // into the attributes hash. Set `includeEmptyRelations` and
      // `includeRelations` in the attributes hash to configure what
      // will end up in the output.
      toJSON: function (associations, original, options) {

        var attributes = original.call(this, options);

        for (key in associations) {
          if (attributes[key] instanceof associations[key].type) {
            attributes[key] = attributes[key].toJSON();
          }
        }

        return attributes;
      }
    };

    return Association;
  })();

  // Expose Association class for extension
  Backbone.Association = Association;

  // Define associations for a model
  Backbone.associate = function (klass, associations) {
    new Association(klass, associations);
  };

  // Remove model associations
  Backbone.dissociate = function (klass) {
    klass._associates.remove();
  };

})(_, Backbone);

