/**
 *  backbone.associate.js v0.0.1
 *  MIT License
 */
(function (_, Backbone) {

  var _slice = [].slice,

    // Helper: sift through the supplied attributes and replace with
    // associated models as needed
    _addAssociations = function (attributes, associations) {
      for (var key in associations) {
        if (!(attributes[key] instanceof associations[key]['type'])) {
          attributes[key] = new (associations[key]['type'])(attributes[key]);
        }
      }
      return attributes;
    },

    // Defines an Association
    Association = Backbone.Association = (function () {

      function Association (klass, associations) {

        var extensions = _.clone(this.extensions),
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

          extensions[key] = function () {
            return this.get(key);
          }
        });

        // apply extensions
        _.each(extensions, function (meth, key) {
          var original = originalMethods[key] = proto[key];
          proto[key] = function () {
            var args = [associations, original].concat(_slice.call(arguments));
            return meth.apply(this, args);
          };
        });

        // store metadata for class (enables dissociation)
        klass._associates = _.extend(this, {
          klass: klass,
          methods: originalMethods
        });
      };

      // self-destruct this association. This is mostly for testing: calling
      // `remove` will unwrap each method in an `associated` model to its 
      // pre-association state with out regard for anything that might have
      // subsequently wrapped it further. This can wreck things--handle with 
      // extreme caution!
      Association.prototype.remove = function () {
        var klass = this.klass;
        for (var meth in this.methods) {
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
          _addAssociations(this['attributes'], associations);
          return original.apply(this, _slice.call(arguments, 2));
        },

        // Update `parse` to create instances of related types and
        // replace the corresponding entries in the attribute hash.
        parse: function (associations, original, resp, options) {
          var attributes = _.defaults(_.clone(resp), this['attributes'], this['defaults']);
          return original.call(this, _addAssociations(attributes, associations), options);
        },

        // Updates `toJSON` to serialize the contents of related types
        // into the attributes hash. Set `includeEmptyRelations` and
        // `includeRelations` in the attributes hash to configure what
        // will end up in the output.
        toJSON: function (associations, original, options) {
          var attributes = original.call(this, options);
          for (var key in associations) {
            if (attributes[key] instanceof associations[key]['type']) {
              attributes[key] = attributes[key].toJSON();
            }
          }
          return attributes;
        }
      };

      return Association;
    })();

  // Define associations for a model
  Backbone.associate = function (klass, associations) {
    new Association(klass, associations);
  };

  // Remove model associations
  Backbone.dissociate = function (klass) {
    klass._associates.remove();
  };

})(_, Backbone);

