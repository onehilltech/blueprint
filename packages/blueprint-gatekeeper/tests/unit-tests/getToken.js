'use strict';

const util    = require ('util')
  , blueprint = require ('@onehilltech/blueprint')
  ;

function getToken (data, callback) {
  blueprint.testing.request ()
    .post ('/v1/oauth2/token')
    .send (data)
    .expect (200).expect('Content-Type', /json/)
    .end (function (err, res) {
      if (err)
        return callback (err);

      return callback (null, res.body);
  });
}

module.exports = getToken;
