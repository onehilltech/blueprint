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

      view : 'helloworld.pug',

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
          console.log ('after getting helloworld view');
          return next ();
        }
      ]
    },

    post : {
      before : [
        printMessage ('before echoing name to view')
      ],

      action : 'HelloWorldController@echoName',

      /**
       * The after property for an action is the same as for a view. The only difference
       * is the action on the controller must take the next callback as its final parameter
       * and invoke it when ready to move forward. Otherwise, middleware included after
       * the action middleware will not execute.
       *
       * See Express.js router documentation for more detail.
       */
      after : [
        printMessage ('after echoing name to view')
      ]
    }
  }
};


