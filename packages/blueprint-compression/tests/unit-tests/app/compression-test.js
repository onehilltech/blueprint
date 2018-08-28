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

const { request } = require ('@onehilltech/blueprint-testing');

describe ('app | compression', function () {
  describe ('/asset', function () {
    it ('should return an uncompressed asset', function () {
      return request ()
        .get ('/asset')
        .expect ('content-type', 'text/html; charset=utf-8')
        .expect ('content-length', '6488666')
        .expect (200);
    });
  });

  describe ('/asset/compression', function () {
    it ('should return an compressed asset', function () {
      return request ()
        .get ('/asset/compression')
        .expect ('content-type', 'text/html; charset=utf-8')
        .expect ('content-encoding', 'gzip')
        .expect (200);
    });
  });
});