const blueprint = require ('@onehilltech/blueprint');
const {expect}  = require ('chai');
const {Schema}  = require ('mongoose');

const {
  model,
  modelOn,
  resource,
  resourceOn
} = require ('../../../lib/models');

describe ('lib | models', function () {
  describe ('model', function () {
    it ('should create model on default connection', function () {
      const schema = new Schema ({ first_name: String, last_name: String });
      let Person = model ('person', schema);

      const connection = blueprint.lookup ('service:mongodb').defaultConnection;
      expect (connection.conn).to.have.nested.property ('models.person', Person);
    });
  });

  describe ('modelOn', function () {
    it ('should create model on targeted connection', function () {
      const schema = new Schema ({ first_name: String, last_name: String });
      let Person = modelOn ('secondary', 'person', schema);

      const connection = blueprint.lookup ('service:mongodb').get ('connections.secondary');
      expect (connection.conn).to.have.nested.property ('models.person', Person);
    });

    it ('should not create model on non-existent connection', function () {
      const schema = new Schema ({ first_name: String, last_name: String });
      let Person = modelOn ('primary', 'person', schema);

      expect (Person).to.be.null;
    });
  });

  describe ('resource', function () {
    it ('should create resource on default connection', function () {
      const schema = new Schema ({ title: String, author: String });
      const Novel = resource ('novel', schema);
      expect (Novel).to.have.nested.property ('schema.options.resource', true);

      const connection = blueprint.lookup ('service:mongodb').defaultConnection;
      expect (connection.conn).to.have.nested.property ('models.novel', Novel);
    });
  });

  describe ('resourceOn', function () {
    it ('should create resource on targeted connection', function () {
      const schema = new Schema ({ title: String, author: String });
      const Book = resourceOn ('secondary', 'book', schema);
      expect (Book).to.have.nested.property ('schema.options.resource', true);

      const connection = blueprint.lookup ('service:mongodb').get ('connections.secondary');
      expect (connection.conn).to.have.nested.property ('models.book', Book);
    });

    it ('should not create resource on non-existent connection', function () {
      const schema = new Schema ({ title: String, author: String });
      const Book = resourceOn ('primary', 'book', schema);

      expect (Book).to.be.null;
    });
  });
});