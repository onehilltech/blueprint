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

const Messenger = require ('../../../../lib/messaging/messenger');
const EventListeners = require ('../../../../lib/messaging/event-listeners');
const ListenerHandle = require ('../../../../lib/messaging/listener-handle');
const expect = require ('chai').expect;

describe ('lib | messaging | Messenger', function () {
  describe ('create', function () {
    it ('should create a Messenger object', function () {
      let messenger = new Messenger ();
      expect (messenger).to.have.deep.property ('_eventListeners', {});
    });
  });

  describe ('lookup', function () {
    it ('should lookup a listener container', function () {
      let messenger = new Messenger ();
      let listeners = messenger.lookup ('a.b');

      expect (listeners).to.be.instanceof (EventListeners);
      expect (listeners).to.have.property ('name', 'a.b');
    });
  });

  describe ('on', function () {
    it ('should register handler for event', function () {
      let messenger = new Messenger ();
      let handle = messenger.on ('a.b', () => {});

      expect (handle).to.be.instanceof (ListenerHandle);
    });
  });

  describe ('once', function () {
    it ('should register handler for event', function () {
      let messenger = new Messenger ();
      messenger.once ('a.b', () => {});

      expect (messenger._eventListeners).to.have.key ('a.b');
    });
  });

  describe ('emit', function () {
    it ('should emit an event', function () {
      let messenger = new Messenger ();
      let value = null;

      messenger.on ('a.b', (val) => value = val);

      return messenger.emit ('a.b', 5).then (() => {
        expect (value).to.equal (5);
      });
    });
  });
});
