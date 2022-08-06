const RedirectAction = require ('../../lib/redirect-action');
const { Controller } = require ('@onehilltech/blueprint');

/**
 * @class RedirectController
 *
 * The controller for redirecting short url requests.
 *
 * The single responsibility of this controller is the take the request, and redirect
 * it to the original url that matches the short url in the request.
 */
module.exports = Controller.extend ({
  __invoke () {
    return RedirectAction;
  }
});
