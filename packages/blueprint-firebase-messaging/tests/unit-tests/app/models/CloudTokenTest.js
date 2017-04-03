'use strict';

const expect   = require ('chai').expect
  ;

describe ('CloudToken', function () {
  it ('should create a new CloudToken model', function () {
    const CloudToken = require ('../../../../app/models/CloudToken');
    expect (new CloudToken ({})).to.not.be.null;
  });
});
