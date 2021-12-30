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

const events = require ('../../../../lib/messaging/events');
const expect = require ('chai').expect;


describe ('lib | messaging | events', function () {
  describe ('@events', function () {
    it ('should decorate an object with event support', function () {
      const Foo = events.decorate (class Foo {});
      const foo = new Foo ();

      expect (foo).to.have.property ('_messenger');
      expect (foo).to.have.property ('__messenger');
      expect (foo).to.respondsTo ('on');
      expect (foo).to.respondsTo ('once');
      expect (foo).to.respondsTo ('emit');
      expect (foo).to.respondsTo ('getListeners');
      expect (foo).to.respondsTo ('hasListeners');
    });
  });
});