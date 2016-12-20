'use strict';

const mongodb  = require ('../../../../lib')
  , expect     = require ('chai').expect
  , StatPlugin = require ('../../../../lib/plugins/StatPlugin')

  ;

describe ('StatPlugin', function () {
  it ('should create a schema with the StatPlugin', function () {
    var schema = new mongodb.Schema ({first_name: String, last_name: String});
    schema.plugin (StatPlugin);

    expect (schema.paths).to.have.property ('_stat.created_at');
    expect (schema.paths).to.have.property ('_stat.updated_at');
  });
});