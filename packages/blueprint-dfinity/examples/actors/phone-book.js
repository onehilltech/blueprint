const { query, update, Actor } = require ('../lib');

/**
 * @class PhonebookActor
 *
 * https://github.com/dfinity/examples/tree/master/motoko/phone-book
 */
module.exports = Actor.extend ({
  insert: update (['text', {
    record: {
      desc: 'text', phone: 'text'
    }
  }], []),

  lookup: query ('text', {
    record: {
      desc: 'text', phone: 'text'
    }
  }),
});

