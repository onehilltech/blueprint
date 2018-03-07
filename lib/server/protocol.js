const Object = require ('../object');

/**
 * @class Protocol
 *
 * Base class for all protocols that can integrate with the server.
 */
module.exports = Object.extend ({
  /// The server object associated with the protocol.
  server: null,

  /// User-defined options for the protocol.
  options: null,

  /**
   * Start listening for incoming connections.
   *
   * @returns {Promise<any>}
   */
  listen () {
    return new Promise ((resolve, reject) => {
      this.server.listen (this.options, (err) => {
        if (err) return reject (err);
        return resolve (null);
      })
    });
  },

  /**
   * Close the server connection.
   *
   * @returns {Promise<any>}
   */
  close () {
    return new Promise ((resolve, reject) => {
      this.server.close (err => {
        if (err) return reject (err);
        return resolve (null);
      });
    });
  }
});
