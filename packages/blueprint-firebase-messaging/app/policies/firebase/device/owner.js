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

const { Policy, model } = require ('@onehilltech/blueprint');

/**
 * A policy that checks if the user making the request is the owner of the
 * device.
 */
module.exports = Policy.extend ({
  failureCode: 'invalid_owner',
  failureMessage: 'You are not the owner of the device.',

  Device: model ('firebase-device'),

  runCheck (req) {
    const { deviceId } = req.params;

    return this.Device.findOne ({ _id: deviceId, account: req.user._id }).then (device => !!device);
  }
});
