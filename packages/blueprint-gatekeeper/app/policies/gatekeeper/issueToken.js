'use strict';

const async   = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , Policy    = blueprint.Policy
  , HttpError = blueprint.errors.HttpError
  , Client    = require ('../../models/Client')
  , granters  = require ('../../middleware/granters')
  , clients   = require ('./clients')
  ;

module.exports = Policy.allSeries ([
  /*
   * The client must exist, and be in good standing.
   */
  function (req, callback) {
    async.waterfall ([
      function (callback) {
        Client.findById (req.body.client_id, callback);
      },

      function (client, callback) {
        if (!client)
          return callback (new HttpError (400, 'invalid_client', 'Client not found'));

        if (!client.enabled)
          return callback (new HttpError (403, 'client_disabled', 'Client is disabled'));

        req.client = client;

        callback (null, true);
      }
    ], callback);
  },

  Policy.all ([
    /*
     * Check the policies for the client type.
     */
    function (req, callback) {
      var clientPolicies = clients[req.client.type];

      if (!clientPolicies)
        return callback (null, true);

      return clientPolicies (req, callback);
    },

    /*
     * Evaluate the policies for the granter.
     */
    function (req, callback) {
      const grantType = req.body.grant_type;
      const policies = granters[grantType].policies;

      if (policies)
        return policies (req, callback);
      else
        return callback (null, true);
    }
  ])
]);

