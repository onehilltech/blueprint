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
const Mixin = require ('../../../lib/mixin');

describe ('lib | Mixin', function () {
  it ('should create an empty mixin', function () {
    let EmptyMixin = Mixin.create ();

    expect (EmptyMixin.mixins).to.be.undefined;
    expect (EmptyMixin.properties).to.be.undefined;
  });

  it ('should create a mixin with properties', function () {
    let A = Mixin.create ({
      a () { },
      b () { },
      c () { }
    });

    expect (A.properties).to.be.undefined;
    expect (A.mixins).to.have.length (1);

    expect (A.mixins[0]).to.be.instanceof (Mixin);
    expect (A.mixins[0].mixins).to.be.undefined;
    expect (A.mixins[0].properties).to.have.keys (['a','b','c']);
  });

  it ('should create a mixin with mixins', function () {
    let A = Mixin.create ({
      a () {},
      b () {},
      c () {}
    });

    let B = Mixin.create (A, {
      d () {},
      e () {}
    });

    expect (B.properties).to.be.undefined;
    expect (B.mixins).to.have.length (2);

    expect (B.mixins[0]).to.be.instanceof (Mixin);
    expect (B.mixins[0].mixins[0].properties).to.have.keys (['a','b','c']);

    expect (B.mixins[1]).to.be.instanceof (Mixin);
    expect (B.mixins[1].properties).to.have.keys (['d','e']);
  });
});
