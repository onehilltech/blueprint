'use strict';

var scope = {
  account: {
    create: 'gatekeeper.account.create',
    getall: 'gatekeeper.account.getall',
    update: 'gatekeeper.account.update',
    delete: 'gatekeeper.account.delete',
    count:  'gatekeeper.account.count'
  },

  client: {
    create: 'gatekeeper.client.create',
    getall: 'gatekeeper.client.getall',
    update: 'gatekeeper.client.update',
    delete: 'gatekeeper.client.delete',
    count:  'gatekeeper.client.count'
  }
};

var exports = module.exports = scope;

exports.superuser = '*';

function compile (name) {
  var regex = new RegExp (name);
  return new Scope (name, regex);
}

exports.compile = compile;

function Scope (value, compiled) {
  this._value = value;
  this._compiled = compiled;
}

Scope.prototype.__defineGetter__ ('value', function () {
  return this._value;
});

/**
 * Test if the scope matches the specified value
 *
 * @param value
 * @returns {Boolean}
 */
Scope.prototype.match = function (value) {
  return this._compiled.test (value);
};
