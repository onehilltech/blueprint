const { Action, NotFoundError } = require ('@onehilltech/blueprint');

module.exports = Action.extend ({
  execute (req, res) {
    return Promise.resolve (this.getAccountId (req))
      .then (accountId => {
        if (!accountId)
          throw new NotFoundError ('account_not_found', 'The account does not exist.');

        return this.doExecute (accountId, req, res);
      });
  },

  getAccountId (req) {

  },

  doExecute (accountId, req, res) {

  }
});
