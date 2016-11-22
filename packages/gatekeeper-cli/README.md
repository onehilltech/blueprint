gatekeeper-cli
==============

command-line interface for Gatekeeper

[![npm version](https://img.shields.io/npm/v/@onehilltech/gatekeeper-cli.svg?maxAge=2592000)](https://www.npmjs.com/package/@onehilltech/gatekeeper-cli)
[![Build Status](https://travis-ci.org/onehilltech/gatekeeper-cli.svg?branch=master)](https://travis-ci.org/onehilltech/gatekeeper-cli)
[![Dependencies](https://david-dm.org/onehilltech/gatekeeper-cli.svg)](https://david-dm.org/onehilltech/gatekeeper-cli)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/gatekeeper-cli/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/gatekeeper-cli?branch=master)

Installation
--------------

    npm install -g @onehilltech/gatekeeper-cli
 
Getting Started
---------------

First, we need to setup Gatekeeper from the Blueprint application directory:

    ./bin/gatekeeper-setup
    
This will register the `gatekeeper-cli` with the current service, and allow you
to run the `gatekeeper-cli` to manage what client and account has access to your
service.

### Adding a client

Each client (i.e., mobile app, web portal, etc.) must be registered with the service
to be allowed access. We can register a new client with the service as follows:

    gatekeeper client add --base <base-uri> <name> <email> [scope]
    
where `scope` is an optional list of strings that define the access scope for the
client (`*` denotes superuser). The client id and secret will be printed to the
console. This should be used with requesting a client-level access token from the
service.

### Adding a user account

It is allow possible to add a user account to the service. The user account represents
an individual who has access to the service. Similar to adding a client, you can add
a user account:

    gatekeeper account add --base 
    
Follow the on-screen prompts to complete the addition process. The `username` 
and `password` are used to create an access token for the user.

Next Steps
----------

For more details, use the `--help` option.

Happy Coding!
