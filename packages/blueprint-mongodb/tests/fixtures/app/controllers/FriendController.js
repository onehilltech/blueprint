'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('../../../../lib')
  , Friend    = require ('../models/Friend')
  , UserResourceController = mongodb.UserResourceController
  ;

function FriendController () {
  UserResourceController.call (this, {
    model: Friend,
    userPath: 'headers.user',
    modelPath: 'person'
  });
}

blueprint.controller (FriendController, UserResourceController);

module.exports = FriendController;
