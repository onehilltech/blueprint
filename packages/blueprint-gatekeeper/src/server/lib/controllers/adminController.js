/**
 * Created by hillj on 6/28/15.
 */

function AdminController () {

}

AdminController.prototype.getHomePage = function () {
  return function (req, res) {
    res.render ('admin/index');
  };
};

exports = module.exports = AdminController;

