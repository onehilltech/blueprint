/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {expect} = require ('chai');
const Service  = require ('../../../../app/services/mongodb');
const mongoose = require ('mongoose');

const path = require ('path');

const {
  BO,
  Events
} = require ('@onehilltech/blueprint');

const {
  forOwn
} = require ('lodash');

function makeService () {
  let app = BO.create (Events, {
    configs: {
      mongodb: {
        connections: {
          $default: {
            uri: 'mongodb://localhost/blueprint-mongodb',
            options: {}
          },

          priority: {
            uri: 'mongodb://localhost/blueprint-mongodb',
            options: {}
          }
        }
      }
    },

    appPath: path.resolve ('./tests/noop/app')
  });

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
      let service = makeService ();
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
        });
    });
  });

  describe.skip ('closeConnections', function () {
    it ('should close all open connections', function () {
      let service = makeService ();
      service.configure ();

      return service.closeConnections ().then (() => {
        forOwn (service.connections, (conn) => {
          expect (conn.readyState).to.equal (0);
        });
      });
    })
  });
});
