const {expect} = require ('chai');
const Service  = require ('../../../../app/services/mongodb');
const mongoose = require ('mongoose');
const { messaging } = require ('@onehilltech/blueprint');

const {
  forOwn
} = require ('lodash');

function makeService () {
  const app = {
    messaging: messaging (),

    configs: {
      mongodb: {
        connections: {
          $default: {
            connstr: 'mongodb://localhost/blueprint-mongodb',
            options: {}
          },

          priority: {
            connstr: 'mongodb://localhost/blueprint-mongodb',
            options: {}
          }
        }
      }
    }
  };

  return new Service ({app});
}

describe ('app | services | mongodb', function () {
  describe ('configure', function () {
    it ('should configure the service', function () {
      let service = makeService ();
      service.configure ();

      expect (service.connections).to.have.keys (['$default', 'priority']);
      expect (service.defaultConnection).to.equal (mongoose.connections[0]);
    });
  });

  describe ('createConnection', function () {
    it ('should not create duplicate connections', function () {
      let service = makeService ()
      service.createConnection ('$default');

      expect (service.connections).to.have.keys (['$default', 'priority']);
    })
  });

  describe ('openConnections', function () {
    it ('should open all connection to the database', function () {
      let service = makeService ();
      service.configure ();

      return service.openConnections ()
        .then (() => {
          // Let's make sure all connections are listed as open.
          forOwn (service.connections, (conn) => {
            expect (conn.readyState).to.equal (1);
          });
        })
        .then (() => service.destroy ());
    });
  });

  describe ('closeConnection', function () {
    it ('should close all open connections', function () {
      let service = makeService ();
      service.configure ();

      return service.openConnections ()
        .then (() => service.closeConnections ())
        .then (() => {
          forOwn (service.connections, (conn) => {
            expect (conn.readyState).to.equal (0);
          });
        });
    })
  });
});
