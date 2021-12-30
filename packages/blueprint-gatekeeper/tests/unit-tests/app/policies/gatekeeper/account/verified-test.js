/*
 * Copyright (c) 2021 One Hill Technologies, LLC
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

describe ('app | policies | gatekeeper | account | verified', function () {
  it ('should authorize request because user is verified', function () {
    return request ()
      .post ('/verified')
      .send ({ message: 'This is a message.' })
      .withUserToken (0)
      .expect (200, { message: 'This is a message.' });
  });

  it ('should authorize request from client', function () {
    return request ()
      .post ('/verified')
      .send ({ message: 'This is a message.' })
      .withClientToken (0)
      .expect (200, { message: 'This is a message.' });
  });

  it ('should fail because user is not verified', function () {
    return request ()
      .post ('/verified')
      .send ({ message: 'This is a message.' })
      .withUserToken (8)
      .expect (403, {
        errors: [
          {
            code: 'failed_policy',
            detail: 'All of the policies failed.',
            status: '403'
          }
        ]
      })
  });
});