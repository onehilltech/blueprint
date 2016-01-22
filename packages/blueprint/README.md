Blueprint
================

[![Build Status](https://travis-ci.org/onehilltech/blueprint.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint)
[![npm version](https://img.shields.io/npm/v/blueprint.svg)](https://npmjs.org/package/blueprint)

A lightweight, simple, elegant framework for building mean applications

* Bootstrap common functionality from configurations
* Separation of concerns to maximize reuse of core business logic
* Quickly bind routes to controller functionality
* Customize  behavior and configuration based on execution environment
* Encapsulate application logic into reusable components
* Compose Blueprint applications from other Blueprint applications

Installation
----------------

    npm install @onehilltech/blueprint --save
    
Getting Started
----------------

First, generate the template for your mean web application, install the dependencies, 
and install the blueprint binaries into the workspace. If you install Blueprint in 
the global space, then you do not need to manually install the Blueprint binaries.

    blueprint init [--path=PATH]
    cd [PATH]
    npm install
    npm bin

Then, just start the web application:

    node ./app
    
See our [Wiki](https://github.com/onehilltech/blueprint/wiki) for more details 
on using Blueprint.
