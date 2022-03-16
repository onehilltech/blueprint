const { model, Service, NotFoundError } = require ('@onehilltech/blueprint');

const DEFAULT_REDIRECT_STATUS = 301;

/**
 * @class url-shortener
 */
module.exports = Service.extend ({
  /**
   * Configure the service.
   */
  configure () {
    const { configs: { urls = {} }} = this.app;
    const { shortener = {} } = urls;

    // Set the shortener configuration.
    Object.defineProperty (this, 'config', { value: shortener });
  },

  /// Reference to the short url model.
  ShortUrl: model ('short-url'),

  /**
   * Shorten an existing a url.
   *
   * @param url           Url to shorten.
   * @param options       Options for shortening the url.
   */
  shorten (url, options = {}) {
    const domain = options.domain || this.config.domain;
    const redirect_status = options.redirect_status || this.config.redirect_status;
    const document = { original_url: url };

    // The user has the option of providing a domain. This can allow a short code
    // to be use more than once.

    if (domain)
      document.domain = domain;

    if (redirect_status)
      document.redirect_status = redirect_status;

    return this.ShortUrl.create (document);
  },

  /**
   * Redirect the short Url.
   *
   * @param req       The request object.
   * @param res       The response object.
   * @param options   The redirect options
   */
  async redirect (req, res, options = {}) {
    // Locate the short url for the request. If we cannot find the short url then we need
    // to throw the not found exception. This will allow the server to respond to the client
    // with the status and error message.

    const criteria = { short_code: req.baseUrl };

    const {
      domain = options.domain || this.config.domain
    } = req.query;

    if (domain)
      criteria.domain = domain;

    const shortUrl = await this.ShortUrl.findOne (criteria);

    if (!shortUrl)
      throw new NotFoundError ('not_found', 'The short url does not exist.');

    // Redirect to the original url.

    const { redirect_status } = options;
    const status = redirect_status || shortUrl.redirect_status || this.config.redirect_status || DEFAULT_REDIRECT_STATUS;

    return res.redirect (status, shortUrl.original_url);
  }
});
