const {expect} = require ('chai');
const Service  = require ('../../../../app/services/mongodb');
const mongoose = require ('mongoose');

describe ('app | services | mongodb', function () {
  it ('should configure the service', function () {
    let service = new Service ();

    service.configure ({
      defaultConnection: '$default'
    });

    expect (service.defaultConnection).to.equal (mongoose.connections[0]);
  });
});
