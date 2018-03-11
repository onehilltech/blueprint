const BlueprintError = require ('../error');

module.exports = function (err, req, res, next) {
  let errType = typeof err;

  if (errType === 'string') {
    res.type ('text/plain');
    return res.status (500).send (err);
  }
  else if (errType === 'object') {
    res.type ('application/json');

    if (err instanceof BlueprintError) {
      // We are working with an instance of a Blueprint error. This means that we have
      // can sent an error object to the client. If the error is a HttpError, then
      // the error object contains the status code as well.
      err.accept ({
        visitHttpError: function (e) { res.status (e.statusCode); },
        visitBlueprintError: function () { res.status (500); }
      });

      let data = {
        errors: {
          code: err.code,
          message: err.message
        }
      };

      if (err.details)
        data.errors.details = err.details;

      res.send (data);
    }
    else if (err instanceof Error) {
      // If this is a plan error object from JavaScript, then the only attribute
      // guaranteed is the message attribute.
      res.status (500).send ({
        errors: {
          message: err.message
        }
      });
    }
    else {
      // This is just a regular object. We are going to set the details
      // attribute on the returned error object.

      res.status (500).send ({
        errors: {
          details: err
        }
      });
    }
  }
};
