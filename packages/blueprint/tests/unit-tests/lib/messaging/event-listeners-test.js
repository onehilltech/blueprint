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

const EventListeners = require ('../../../../lib/messaging/event-listeners');
const Listener = require ('../../../../lib/messaging/listener');
const NoopListener = require ('../../../../lib/messaging/noop-listener');
const expect = require ('chai').expect;

describe ('lib | messaging | EventListeners', function () {
  describe ('create', function () {
    it ('should create an EventListener object', function () {
      let listeners = new EventListeners ('foo');

      expect (listeners).to.deep.include ({name: 'foo', _on: [], _once: []});
    });
  });

  describe ('on', function () {
    it ('should add a new listener', function () {
      let listeners = new EventListeners ('foo');
      listeners.on (new NoopListener ());

      expect (listeners._on).to.have.length (1);
    });
  });

  describe ('once', function () {
    it ('should add a new listener', function () {
      let listeners = new EventListeners ('foo');
      listeners.once (new NoopListener ());

      expect (listeners._once).to.have.length (1);
    });
  });

  describe ('removeListenerAt', function () {
    it ('should remove a listener', function () {
      let listeners = new EventListeners ('foo');

      listeners.on (new NoopListener ());
      listeners.removeListenerAt (0);

      expect (listeners._once).to.have.length (0);
    });
  });

  describe ('emit', function () {
    it ('should emit an event', async function () {
      let e1;
      let e2;

      const listeners = new EventListeners ('foo');

      listeners.on ((e) => e1 = e);
      listeners.once ((e) => e2 = e);

      await listeners.emit (5);

      expect (e1).to.equal (5);
      expect (e2).to.equal (5);
      expect (listeners._once).to.have.length (0);
    });
  });
});