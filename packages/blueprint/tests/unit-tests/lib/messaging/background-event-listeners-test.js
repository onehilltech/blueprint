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

const BackgroundListener = require ('../../../../lib/messaging/background-listener');
const { expect } = require ('chai');

describe ('lib | messaging | BackgroundListener', function () {
  it ('should handle the event in the background', function (done) {
    const L = class extends BackgroundListener {
      handleBackgroundEvent (n) {
        expect (n).to.equal (5);
        this.value = 5;

        return n;
      }
    };

    const listener = new L ();

    expect (listener.handleEvent (5)).to.equal (undefined);

    process.nextTick (() => {
      expect (listener.value).to.equal (5);

      done ();
    });
  });
});