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

const mongodb = require ('../../../../lib');
const {expect} = require ('chai');
const ConstPlugin = require ('../../../../lib/plugins/const')

describe ('lib | plugins | ConstPlugin', function () {
  let Person;

  before (function () {
    let schema = new mongodb.Schema ({
      first_name: String,
      last_name: String,

      // This field should be const after initial creation.
      creator: {type: String, required: true, const: true}
    });

    schema.plugin (ConstPlugin);

    Person = mongodb.model ('person', schema, 'blueprint_persons');
  });


  it ('should create a schema with the const fields', function () {
    expect (Person.const ()).to.eql (['creator']);
  });

  describe ('save', function () {
    it ('should not update a const field', function () {
      let person = new Person ({first_name: 'James', last_name: 'Hill', creator: 'me'});

      return person.save ()
        .then (person => {
          person.creator = 'you';
          expect (person.creator).to.equal ('me');

          return person.save ();
        })
        .then (person => {
          // The value should still be the same after a save.
          expect (person.creator).to.equal ('me');

          // Make sure we can pull the original value out of the database.
          return Person.findById (person.id);
        })
        .then (person => expect (person.creator).to.equal ('me'));
    });
  });

  describe ('findOneAndUpdate', function () {
    it ('should not update a const field', function () {
      let person = new Person ({first_name: 'John', last_name: 'Doe', creator: 'me'});

      return person.save ()
        .then (person => Person.findOneAndUpdate ({_id: person._id}, {creator: 'you'}, {new: true}))
        .then (person => {
          // The value should still be the same after a save.
          expect (person.creator).to.equal ('me');

          // Make sure we can pull the original value out of the database.
          return Person.findById (person._id);
        })
        .then (person => {
          expect (person.creator).to.equal ('me');
        });
    });
  });

  describe ('update', function () {
    it ('should not update a const field', function () {
      return Person.create ({first_name: 'Jack', last_name: 'Black', creator: 'me'})
        .then (person => {
          return Person.updateOne ({id: person._id}, { creator: 'you' })
            .then (result => {
              expect (result).to.eql ({
                acknowledged: true,
                modifiedCount: 1,
                upsertedId: null,
                upsertedCount: 0,
                matchedCount: 1,
              });

              return Person.findById (person._id);
            })
            .then (person => expect (person.creator).to.equal ('you'));
        });
    });
  });
});