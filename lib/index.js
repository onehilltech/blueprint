module.exports = exports = require ('./-framework');

/// Load the testing module on demand. This will eventually be moved to
/// the blueprint-testing package.

Object.defineProperty (exports, 'testing', {
  get: function () { return require ('./testing'); }
});

exports.messaging = require ('./messaging');

exports.Controller = require ('./controller');
exports.ResourceController = require ('./resource-controller');

exports.barrier = require ('./barrier');
exports.BlueprintError = require ('./error');
exports.HttpError = require ('./http-error');
exports.Policy = require ('./policy');

// built-in actions
exports.Action = require ('./action');

exports.ViewAction = require ('./view-action');
exports.SingleViewAction = require ('./single-view-action');

exports.UploadAction = require ('./upload-action');
exports.SingleFileUploadAction = require ('./single-file-upload-action');
exports.ArrayUploadAction = require ('./array-upload-action');
exports.FieldsUploadAction = require ('./fields-upload-action');
exports.TextOnlyUploadAction = require ('./text-only-upload-action');