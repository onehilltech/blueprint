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

const AsyncListener = require ('../../../../lib/messaging/async-listener');
const { expect } = require ('chai');

describe ('lib | messaging | AsyncListener', function () {
  it ('should create an async event listener', function () {
    const listener = AsyncListener.create ({
      asyncHandleEvent (ev) {

      }
    });

    expect (listener).to.not.equal (null);
  });

  it ('should throw exception if missing asyncHandleEvent() method', function () {
    expect (() => AsyncListener.create ()).to.throw ('The asynchronous listener must implement the asyncHandleEvent() method.');
  });

  it ('should have the event asynchronously', function (done) {
    const listener = AsyncListener.create ({
      value: null,

      asyncHandleEvent (n) {
        expect (n).to.equal (5);
        this.value = 5;

        return n;
      }
    });

    expect (listener.handleEvent (5)).to.equal (undefined);

    process.nextTick (() => {
      expect (listener.value).to.equal (5);

      done ();
    });
  });
});