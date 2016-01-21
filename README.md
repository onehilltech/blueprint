Blueprint
================

[![Build Status](https://travis-ci.org/onehilltech/blueprint.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint)
[![npm version](https://img.shields.io/npm/v/blueprint.svg)](https://npmjs.org/package/blueprint)

A lightweight, simple, elegant framework for building mean applications

* Bootstrap web applications from configurations
* Separation of concerns to maximize reuse of functionality
* Quickly bind routes to controller functionality
* Define web application behavior and configurations based on execution environment
* Encapsulate web application logic into reusable components
* Compose Blueprint web applications from other Blueprint web applications

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
