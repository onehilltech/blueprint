'use strict';

function MasterApplication (appPath, messaging) {
  this.appPath = appPath;
  this._messaging = messaging;
}

module.exports = MasterApplication;

MasterApplication.prototype.init = function (callback) {
  this._isInit = true;
  return callback (null, this);
};

MasterApplication.prototype.start = function (callback) {
  this._isStarted = true;
  return callback (null, this);
};

MasterApplication.prototype.restart = function (callback) {
  return callback (null, this);
};

MasterApplication.prototype.destroy = function (callback) {
  return callback (null, this);
};

MasterApplication.prototype.__defineGetter__ ('isInit', function () {
  return this._isInit;
});

MasterApplication.prototype.__defineGetter__ ('isStarted', function () {
  return this._isStarted;
});