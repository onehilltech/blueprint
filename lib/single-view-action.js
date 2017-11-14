const ViewAction = require ('./action')
  ;

/**
 * @class ViewAction
 *
 * The ViewAction is an action that renders a view. This is the equivalent of
 * server-side rendering, which is common in traditional web applications.
 *
 * A subclass must implement the following methods:
 *
 * - view ()
 * - model ()
 */
const SingleViewAction = ViewAction.extend ({
  do
});

module.exports = ViewAction;
