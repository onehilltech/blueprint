const { Controller, Action } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  json () {
    return Action.extend ({
      /// Cached version of the SwaggerUI specification.
      _spec: null,

      /// The specification builder, which is a promise.
      _builder: null,

      execute (req, res) {
        if (!!this._spec)
          return res.status (200).json (this._spec);

        return this.build ().then (spec => res.status (200).json (spec));
      },

      build () {
        if (this._builder)
          return this._builder;

        return this._builder = new Promise ((req, res) => {

        });
      }
    });
  }
});
