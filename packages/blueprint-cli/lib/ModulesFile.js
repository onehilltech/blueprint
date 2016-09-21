'use strict';

var async = require ('async')
  , fse = require ('fs-extra')
  , esprima = require ('esprima')
  , escodegen = require ('escodegen')
  ;

module.exports = _ModulesFile;

const DEFAULT_ENCODING = 'utf-8';

const DEFAULT_OPTIONS = {
  format: {
    indent: {
      style: '  '
    }
  }
};

function _ModulesFile (file, callback) {
  async.waterfall ([
    // Open the file, and read its content.
    function (callback) {
      fse.readFile (file, DEFAULT_ENCODING, callback);
    },

    // Parse the contents of the file.
    function (code, callback) {
      var tree = esprima.parse (code);
      return callback (null, new ModulesFile (file, tree));
    }
  ], callback);
}

function ModulesFile (file, tree) {
  this._file = file;
  this._tree = tree;
}

ModulesFile.prototype.addToSet = function (name, callback) {
  var self = this;

  async.waterfall ([
    function (callback) { self.contains (name, callback); },
    function (found, callback) {
      if (!found) {
        var line = esprima.parse ('"' + name + '"');
        var literal = line.body[0].expression;

        self._tree.body[0].expression.right.right.elements.push (literal);
      }

      return callback (null, !found);
    }
  ], callback);
};

ModulesFile.prototype.contains = function (name, callback) {
  async.detect (
    this._tree.body[0].expression.right.right.elements,
    function (item, callback) {
      return callback (null, item.value === name);
    },
    function (err, result) {
      return callback (err, result !== undefined);
    });
};

ModulesFile.prototype.remove = function (name, callback) {
  var self = this;

  async.filter (
    this._tree.body[0].expression.right.right.elements,
    function (item, callback) {
      return callback (null, item.value !== name);
    },
    function (err, result) {
      var oldLength = self._tree.body[0].expression.right.right.elements.length;
      var newLength = result.length;

      if (oldLength !== newLength)
        self._tree.body[0].expression.right.right.elements = result;

      return callback (err, oldLength !== newLength);
    });
};

ModulesFile.prototype.save = function (callback) {
  var source = escodegen.generate (this._tree, DEFAULT_OPTIONS);
  fse.writeFile (this._file, source, callback);
};
