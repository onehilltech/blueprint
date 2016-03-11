function printMessage (msg) {
  return function (req, res, next) {
    console.log (msg);
    return next ();
  }
}

module.exports = exports = {
  '/helloworld' : {
    get  : {
      /**
       * The before attribute allows you to define middleware that executes
       * before calling the main action of the verb. Below, we embed a function.
       * It is recommend that you embed a function call that returns a middleware
       * function to improve code quality.
       *
       * See the post verb below for an example.
       */
      before : [
        function (req, res, next) {
          console.log ('before getting helloworld view');
          return next ();
        }
      ],

      view   : 'helloworld',

      /**
       * The after attribute allows you to define middleware that executes
       * after calling the main action of the verb. Below, we embed a function.
       * It is recommend that you embed a function call that returns a middleware
       * function to improve code quality.
       *
       * See the post verb below for an example.
       */
      after : [
        function (req, res, next) {
          console.log ('after getting helloworld view')
        }
      ]
    },

    post : {
      before : [
        printMessage ('before echoing name to view')
      ],

      action : 'HelloWorldController@echoName',

      after : [
        printMessage ('after echoing name to view')
      ]
    }
  }
};


