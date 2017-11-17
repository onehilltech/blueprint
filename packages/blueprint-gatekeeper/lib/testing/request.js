const blueprint = require ('@onehilltech/blueprint')
  , Test        = require ('supertest').Test
  , assert      = require ('assert')
  ;

/**
 * Creates a Blueprint testing request that has already be initialized to a user.
 *
 * @param i       Index of user from dab file
 * @param conn    Name of database connection
 */
Test.prototype.withUserToken = Test.prototype.fromUser = function (i, conn = '$default') {
  let accessToken = blueprint.app.seeds[conn].user_tokens[i].serializeSync ();

  assert (!!accessToken, `Your dab file does not have a user_tokens.[${i}]`);

  return this.set ('Authorization', `Bearer ${accessToken.access_token}`);
};

/**
 * Creates a Blueprint testing request that has already be initialized to a client.
 *
 * @param i     Index of client from dab file
 * @param conn    Name of database connection
 */
Test.prototype.withClientToken = Test.prototype.fromClient = function (i, conn = '$default') {
  let accessToken = blueprint.app.seeds[conn].client_tokens[i].serializeSync ();

  assert (!!accessToken, `Your dab file does not have a client_tokens.[${i}]`);

  return this.set ('Authorization', `Bearer ${accessToken.access_token}`);
};
