const Action = require ('action');

const StaticViewAction = Action.extend ({
  doRequest (req, res) {
    req.render (this.view);
    return Promise.resolve (null);
  }
});
