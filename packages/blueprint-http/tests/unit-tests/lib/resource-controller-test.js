let {expect} = require ('chai');
let assert = require ('assert')
let ResourceController = require ('../../../lib/resource-controller');
let HttpError = require ('../../../lib/http-error');

function notFoundTest (method) {
  describe (method, function () {
    it ('should throw an exception', function () {
      let rc = new ResourceController ({name: 'book'});

      let Action = rc[method] ();
      let action = new Action ();

      return action.execute ().catch (err => {
        expect (err).to.be.instanceof (HttpError);
      });
    });
  });
}

describe ('lib | ResourceController', function () {
  describe ('constructor', function () {
    it ('should create a ResourceController', function () {
      let rc = new ResourceController ({name: 'book'});

      expect (rc).to.deep.include ({
        name: 'book',
        id: 'bookId',
        _actions: {
          create: {verb: 'post', method: 'create'},
          getAll: {verb: 'get', method: 'getAll'},
          getOne: {verb: 'get', path: '/:rcId', method: 'getOne'},
          update: {verb: 'put', path: '/:rcId', method: 'update'},
          delete: {verb: 'delete', path: '/:rcId', method: 'delete'},
          count: {verb: 'get', path: '/count', method: 'count'}
        }
      });

      expect (rc.actions).to.equal (rc._actions);
    });

    it ('should throw an exception because it is missing the name', function () {
      expect (() => { new ResourceController ()}).to.throw (assert.AssertionError);
    })
  });

  notFoundTest ('create');
  notFoundTest ('getOne');
  notFoundTest ('getAll');
  notFoundTest ('update');
  notFoundTest ('delete');
  notFoundTest ('count');
});