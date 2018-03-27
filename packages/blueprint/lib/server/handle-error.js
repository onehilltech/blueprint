const BlueprintError = require ('../error');
const {
  isObjectLike,
  isString
} = require ('lodash');

module.exports = function (err, req, res, next) {
  if (isString (err)) {
    res.type ('text/plain');
    return res.status (500).send ({errors: [{detail: err}]});
  }
  else if (isObjectLike (err)) {
    res.type ('application/json');

    if (err instanceof BlueprintError) {
      // We are working with an instance of a Blueprint error. This means that we have
      // can sent an error object to the client. If the error is a HttpError, then
      // the error object contains the status code as well.
      let data = {
        errors: [{code: err.code, detail: err.message }]
      };

      err.accept ({
        visitHttpError: function (e) {
          res.status (e.statusCode);
          data.errors[0].status = `${e.statusCode}`;
        },
        visitBlueprintError: function () {
          res.status (500);
          data.errors[0].status = '500';
        }
      });

      if (err.details)
        errors[0].meta = err.details;

      res.send (data);
    }
    else if (err instanceof Error) {
      // If this is a plan error object from JavaScript, then the only attribute
      // guaranteed is the message attribute.
      res.status (500).send ({errors: [{detail: err.message}]});
    }
    else {
      // This is just a regular object. We are going to set the meta
      // attribute on the returned error object.

      res.status (500).send ({errors: [{meta: err}]});
    }
  }
};
