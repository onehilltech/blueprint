'use strict';

const dab = require ('@onehilltech/dab')
  ;

module.exports = {
  degrees: [
    {degree: 'PhD', major: 'Computer Science', school: 'Vanderbilt University'},
    {degree: 'MS', major: 'Computer Science', school: 'Vanderbilt University'},
    {degree: 'BS', major: 'Computer Science', school: 'Morehouse College'}
  ],

  persons: [
    {
      first_name: 'John',
      last_name: 'Doe',
      age: 25,
      gender: 'Male',
      dob: '2015-10-12 12:00:00',

      address: {
        street: '123 Memory Lane',
        city: 'Gotham City',
        state: 'IN',
        zipcode: '12345'
      },

      education: dab.ref ('degrees.0')
    }
  ]

};
