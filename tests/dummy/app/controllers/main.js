const {
  Controller,
  Action,
  service,
  model
} = require ('../../../../lib');

module.exports = Controller.extend ({
  cart: service (),
  shoppingCart: service ('shopping-cart'),

  person: model (),
  model: model ('person'),

  __invoke () {
    return Action.extend ({
      execute (req, res) {
        return res.status (200).json (true);
      }
    });
  },

  performGet () {
    return Action.extend ({
      execute (req, res) {
        return res.status (200).json (true);
      }
    });
  },

  getFunction () {
    return function (req, res, next) {
      res.status (200).json ({result: 'getFunction'});
      next ();
    };
  },

  getFunctionArray () {
    return [
      (req, res, next) => { next () },
      (req, res, next) => {
        res.status (200).json ({result: 'getFunctionArray'});
        next ();
      }
    ]
  },

  getLegacyObjectWithValidateFunction () {
    return {
      validate (req, callback) { callback (null); },
      sanitize (req, callback) { callback (null); },
      execute (req, res, next) {
        res.status (200).json ({result: 'getLegacyObjectWithValidateFunction'});
        next ();
      }
    }
  },

  getLegacyObjectWithValidateSchema () {
    return {
      validate: {},
      execute (req, res, next) {
        res.status (200).json ({result: 'getLegacyObjectWithValidateSchema'});
        next ();
      }
    }
  },

  getActionWithSchema () {
    return Action.extend ({
      schema: {
        id: {
          // The location of the field, can be one or more of body, cookies, headers, params or query.
          // If omitted, all request locations will be checked
          in: ['params', 'query'],
          errorMessage: 'ID is wrong',
          optional: true,
          isInt: true,
          // Sanitizers can go here as well
          toInt: true
        },
      },

      execute (req, res, next) {
        res.status (200).json ({result: 'getActionWithSchema'});
        next ();
      }
    });
  },

  getActionWithValidate () {
    return Action.extend ({
      validate: [
        check ('username')
          .isEmail().withMessage('must be an email')
          .optional ()
          .trim()
          .normalizeEmail()
      ],

      execute (req, res, next) {
        res.status (200).json ({result: 'getActionWithValidate'});
        next ();
      }
    });
  },

  postActionWithValidateFail ( ) {
    return Action.extend ({
      validate: [
        check ('username')
          .isEmail ().withMessage('The username must be an email')
          .trim()
          .normalizeEmail()
      ],

      execute (req, res, next) {
        res.status (200).json ({result: 'postActionWithValidateFail'});
        next ();
      }
    });
  }
});
