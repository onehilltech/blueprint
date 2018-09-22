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

const assert = require ('assert');
const ApproveDomains = require ('./approve-domains');

const DEFAULT_RSA_KEY_SIZE = 2048;
const DEFAULT_CHALLENGE_TYPE = 'http-01';

/**
 * @class BasicApproveDomains
 *
 * Basic implementation for approving the domains.
 */
module.exports = ApproveDomains.extend ({
  config: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.config.email, 'You must define the email property in greenlock configuration.');
  },

  approveDomains (opts, certs) {
    if (!this.config.domains.includes (opts.domain))
      return Promise.reject (new Error (`This application is not configured for domain ${opts.domain}.`));

    // Copy the options so we do not taint the original options.
    let options = Object.assign ({}, opts);

    if (this.config.communityMember)
      options.communityMember = this.config.communityMember;

    if (this.config.securityUpdates)
      options.securityUpdates = this.config.securityUpdates;

    if (this.config.rsaKeySize)
      options.rsaKeySize = this.config.rsaKeySize;
    else
      options.rsaKeySize = DEFAULT_RSA_KEY_SIZE;

    if (this.config.challengeType)
      options.challengeType = DEFAULT_CHALLENGE_TYPE;

    if (certs) {
      options.domains = certs.altnames;
    }
    else {
      options.email = this.config.email;
      options.agreeTos = true;
    }

    return { options, certs };
  }
});

