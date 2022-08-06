const { Action, service } = require ('@onehilltech/blueprint');

/**
 * @class RedirectAction
 *
 * A simple action for redirecting a short url to its original url. This action
 * can be use in Blueprint controllers.
 */
module.exports = Action.extend ({
  /// Reference to the url shortener service.
  UrlShortener: service ('url-shortener'),

  /**
   * Get the options for the request.
   *
   * @param req
   * @return {{}}
   */
  async getOptions (req) {
    return { };
  },

  /**
   * Execute the action.
   *
   * @param req
   * @param res
   */
  async execute (req, res) {
    const options = await this.getOptions (req);
    return this.UrlShortener.redirect (req, res, options);
  }
});