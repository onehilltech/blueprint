const { BO } = require ('@onehilltech/blueprint');

/**
 * @class Migration
 *
 * The base class for database migrations. A migration occurs when the schema version
 * either increases or decreases.
 */
module.exports = BO.extend ({
  /**
   * Prepare for migration. This method is called before migrate() is called.
   *
   * @param connection      A Mongoose connection.
   */
  prepare (connection) {

  },

  /**
   * Migrate the database on the specified connection.
   *
   * @param connection      A Mongoose connection
   */
  migrate (connection) {
    throw new Error ('You must implement the migrate() method.');
  },

  /**
   * Perform any finalization steps for the migration.
   *
   * @param connection
   */
  finalize (connection) {

  }
});
